const express = require('express');
const router = express.Router();
const Onboarding = require('../models/hr/onboarding');
const Application = require('../models/career/application');
const Opening = require('../models/career/opening');
const LeaveRequest = require('../models/hr/leaveRequest');
const RegisterUser = require('../models/register/registerModel');
const HrController = require('../Controller/AdminController/FrontController/HrController');
const CareerController = require('../Controller/AdminController/FrontController/CareerController');
const adminVerify = require('../middleware/adminVerify');
const hrAdminVerify = adminVerify.hrAdminVerify;
const { sendEmail, uploadFile } = require('../Utilities/s3HelperUtility');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Helper: simple sender
const fromAddr = process.env.SES_FROM || process.env.SMTP_FROM || process.env.SMTP_USER || 'hr@100acress.com';

const DEFAULT_EMAIL_INSTRUCTIONS = `
Please be available 10 minutes before the scheduled time.
Keep a stable internet connection (for online interviews).
Keep your resume and government ID handy.
If you face any issue, reply to this email and we will assist you.`;

const DEFAULT_INTERVIEW_LOCATION = 'ILD Trade Center, 806 Near Malibu Town Sector 47, Gurugram 122018, Sohna Road';
const DEFAULT_INTERVIEW_START_TIME = '11:30';
const DEFAULT_INTERVIEW_END_TIME = '13:00';

// Helper: ensure onboarding exists for all approved applications
async function syncApprovedApplications() {
  const approved = await Application.find({ status: 'approved' });
  const existing = await Onboarding.find({ applicationId: { $in: approved.map(a => a._id) } }).select('applicationId');
  const existingSet = new Set(existing.map(e => String(e.applicationId)));

  const toCreate = [];
  for (const app of approved) {
    if (!existingSet.has(String(app._id))) {
      toCreate.push({
        applicationId: app._id,
        openingId: app.openingId,
        candidateName: app.name,
        candidateEmail: app.email,
        currentStageIndex: 0,
        history: [{ stage: 'interview1', note: 'Auto-synced from approved application' }],
      });
    }
  }
  if (toCreate.length) await Onboarding.insertMany(toCreate);
  return { created: toCreate.length, totalApproved: approved.length };
}

// Manual sync endpoint
router.post('/onboarding/sync', async (req, res) => {
  try { const result = await syncApprovedApplications(); res.json({ message: 'Sync complete', ...result }); }
  catch { res.status(500).json({ message: 'Sync failed' }); }
});

// List onboarding candidates (auto-sync before listing)
router.get('/onboarding', async (req, res) => {
  try { await syncApprovedApplications(); const list = await Onboarding.find({}).sort({ createdAt: -1 }); res.json({ data: list }); }
  catch { res.status(500).json({ message: 'Failed to fetch onboarding list' }); }
});

// Create manual onboarding entry (for direct employee addition)
router.post('/onboarding/create', async (req, res) => {
  try {
    const { candidateName, candidateEmail, position, department, phone, joiningDate, notes } = req.body || {};
    
    if (!candidateName || !candidateEmail) {
      return res.status(400).json({ message: 'Candidate name and email are required' });
    }

    // Create or find a placeholder opening for manual onboarding
    let placeholderOpening = await Opening.findOne({ jobTitle: 'Manual Onboarding', status: 'open' });
    if (!placeholderOpening) {
      placeholderOpening = await Opening.create({
        jobTitle: 'Manual Onboarding',
        jobLocation: 'N/A',
        status: 'open',
        responsibility: 'Manual onboarding entry',
        experience: 'N/A',
        skill: 'N/A',
        jobProfile: 'Manual onboarding entry'
      });
    }

    // Create a placeholder application for manual onboarding
    const placeholderApp = await Application.create({
      name: candidateName,
      email: candidateEmail,
      phone: phone || '',
      resumeUrl: '',
      coverLetter: notes || `Manual onboarding entry${position ? ` - Position: ${position}` : ''}${department ? `, Department: ${department}` : ''}`,
      status: 'approved', // Auto-approve manual entries
      openingId: placeholderOpening._id
    });

    // Create onboarding entry
    const newOnboarding = await Onboarding.create({
      applicationId: placeholderApp._id,
      openingId: placeholderOpening._id,
      candidateName,
      candidateEmail,
      currentStageIndex: 0,
      stages: ['interview1', 'hrDiscussion', 'documentation', 'success'],
      status: 'in_progress',
      joiningDate: joiningDate ? new Date(joiningDate) : undefined,
      history: [{ 
        stage: 'interview1', 
        note: `Manual onboarding entry${position ? ` - Position: ${position}` : ''}${department ? `, Department: ${department}` : ''}`,
        movedAt: new Date()
      }],
      stageData: {
        interview1: { status: 'pending' },
        hrDiscussion: { status: 'pending' },
        documentation: { status: 'pending' }
      }
    });

    res.json({ message: 'Onboarding entry created successfully', data: newOnboarding });
  } catch (e) {
    console.error('Error creating manual onboarding:', e);
    res.status(500).json({ message: 'Failed to create onboarding entry: ' + e.message });
  }
});

// Delete onboarding entry
router.delete('/onboarding/:id', async (req, res) => {
  try {
    const onboarding = await Onboarding.findById(req.params.id);
    if (!onboarding) {
      return res.status(404).json({ message: 'Onboarding entry not found' });
    }

    // Delete related application if it exists
    if (onboarding.applicationId) {
      await Application.findByIdAndDelete(onboarding.applicationId);
    }

    // Delete the onboarding entry
    await Onboarding.findByIdAndDelete(req.params.id);

    res.json({ message: 'Onboarding entry deleted successfully' });
  } catch (e) {
    console.error('Error deleting onboarding:', e);
    res.status(500).json({ message: 'Failed to delete onboarding entry: ' + e.message });
  }
});

// Get onboarding by id
router.get('/onboarding/:id', async (req, res) => {
  try { const it = await Onboarding.findById(req.params.id); if (!it) return res.status(404).json({ message: 'Not found' }); res.json({ data: it }); }
  catch { res.status(500).json({ message: 'Failed to fetch onboarding' }); }
});

// Invite for a stage (interview1 or hrDiscussion)
router.post('/onboarding/:id/invite', async (req, res) => {
  try {
    const { stage, type, tasks = [], scheduledAt, endsAt, meetingLink, location, content } = req.body || {};
    if (!stage || !['interview1','hrDiscussion'].includes(stage)) return res.status(400).json({ message: 'Invalid stage' });
    if (!type || !['online','offline'].includes(type)) return res.status(400).json({ message: 'Invalid invite type' });

    const it = await Onboarding.findById(req.params.id);
    if (!it) return res.status(404).json({ message: 'Not found' });

    const opening = it.openingId ? await Opening.findById(it.openingId).select('jobTitle jobProfile jobLocation') : null;
    const profileName = (opening?.jobTitle || opening?.jobProfile || 'this position');

    it.stageData = it.stageData || {};
    const payload = { 
      type, 
      tasks, 
      scheduledAt: scheduledAt || null, 
      endsAt: endsAt || null, 
      meetingLink, 
      location: location || (type === 'offline' ? DEFAULT_INTERVIEW_LOCATION : ''), 
      content, 
      sentAt: new Date() 
    };
    it.stageData[stage] = it.stageData[stage] || {};
    it.stageData[stage].invite = payload;
    it.stageData[stage].status = 'invited';
    await it.save();

    const escapeHtml = (value) => {
      if (value === null || value === undefined) return '';
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    };

    const stageLabel = stage === 'interview1' ? 'First Interview' : 'HR Discussion';
    const roundText = `${stageLabel} (for ${profileName})`;
    const scheduleText = scheduledAt
      ? `${new Date(scheduledAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}${endsAt ? ' - ' + new Date(endsAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : ''}`
      : `Default time: ${DEFAULT_INTERVIEW_START_TIME} - ${DEFAULT_INTERVIEW_END_TIME}`;

    const mainMessage = (content && String(content).trim())
      ? String(content).trim()
      : 'You are invited for the next step in our hiring process.';

    const instructionsText = DEFAULT_EMAIL_INSTRUCTIONS;

    const defaultTasks = [
      { title: 'Keep your updated resume ready' },
      { title: 'Be available 10 minutes early' },
      { title: 'Check your internet / device (for online)' },
    ];
    const effectiveTasks = (Array.isArray(tasks) && tasks.length) ? tasks : defaultTasks;

    const metaRows = [
      scheduleText
        ? `<tr>
            <td style="padding:10px 0;border-bottom:1px solid #edf0f3;vertical-align:top;width:140px;color:#6b7280;font-size:14px;">Schedule</td>
            <td style="padding:10px 0;border-bottom:1px solid #edf0f3;vertical-align:top;color:#111827;font-size:14px;">${escapeHtml(scheduleText)}</td>
          </tr>`
        : '',
      type === 'offline' && (location || DEFAULT_INTERVIEW_LOCATION)
        ? `<tr>
            <td style="padding:10px 0;border-bottom:1px solid #edf0f3;vertical-align:top;width:140px;color:#6b7280;font-size:14px;">Location</td>
            <td style="padding:10px 0;border-bottom:1px solid #edf0f3;vertical-align:top;color:#111827;font-size:14px;">${escapeHtml(location || DEFAULT_INTERVIEW_LOCATION)}</td>
          </tr>`
        : '',
      type === 'online' && meetingLink
        ? `<tr>
            <td style="padding:10px 0;border-bottom:1px solid #edf0f3;vertical-align:top;width:140px;color:#6b7280;font-size:14px;">Meeting Link</td>
            <td style="padding:10px 0;border-bottom:1px solid #edf0f3;vertical-align:top;color:#111827;font-size:14px;">
              <a href="${escapeHtml(meetingLink)}" style="color:#2563eb;text-decoration:none;word-break:break-all;">${escapeHtml(meetingLink)}</a>
            </td>
          </tr>`
        : '',
    ].filter(Boolean).join('');

    const tasksHtml = effectiveTasks?.length
      ? `
        <div style="margin-top:18px;">
          <div style="font-size:14px;font-weight:700;color:#111827;margin:0 0 10px 0;">Tasks</div>
          <div style="border:1px solid #edf0f3;border-radius:10px;overflow:hidden;">
            ${effectiveTasks
              .map((t) => {
                const title = escapeHtml(t?.title || '');
                const due = t?.dueAt ? new Date(t.dueAt).toLocaleDateString('en-US') : 'N/A';
                const desc = escapeHtml(t?.description || '');
                return `
                  <div style="padding:12px 14px;border-top:1px solid #edf0f3;">
                    <div style="font-size:14px;color:#111827;font-weight:700;margin:0 0 4px 0;">${title}</div>
                    <div style="font-size:13px;color:#6b7280;margin:0 0 6px 0;">Due: ${due}</div>
                    ${desc ? `<div style=\"font-size:13px;color:#111827;line-height:1.5;\">${desc}</div>` : ''}
                  </div>`;
              })
              .join('')
              .replace('<div style="padding:12px 14px;border-top:1px solid #edf0f3;">', '<div style="padding:12px 14px;">')
            }
          </div>
        </div>`
      : '';

    const ctaHtml = type === 'online' && meetingLink
      ? `
        <div style="margin-top:18px;">
          <a href="${escapeHtml(meetingLink)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 16px;border-radius:10px;font-size:14px;font-weight:700;">Join Meeting</a>
          <div style="font-size:12px;color:#6b7280;margin-top:10px;">If the button doesn’t work, copy and paste this link: <span style="color:#111827;word-break:break-all;">${escapeHtml(meetingLink)}</span></div>
        </div>`
      : '';

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <title>Interview Invitation</title>
        </head>
        <body style="margin:0;padding:0;background:#f6f7fb;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f6f7fb;padding:24px 12px;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 6px 24px rgba(15,23,42,0.08);">
                  <tr>
                    <td style="padding:18px 20px;background:linear-gradient(135deg,#0ea5e9,#2563eb);">
                      <div style="font-family:Arial,sans-serif;color:#ffffff;font-size:18px;font-weight:800;letter-spacing:0.2px;">100acress.com</div>
                      <div style="font-family:Arial,sans-serif;color:#eaf2ff;font-size:13px;margin-top:4px;">HR Team</div>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:22px 20px;font-family:Arial,sans-serif;color:#111827;">
                      <div style="font-size:18px;font-weight:800;margin:0 0 6px 0;">Interview Invitation</div>
                      <div style="font-size:14px;color:#6b7280;margin:0 0 6px 0;">Round: ${escapeHtml(stageLabel)}</div>
                      <div style="font-size:14px;color:#6b7280;margin:0 0 16px 0;">Shortlisted for: <strong style=\"color:#111827;\">${escapeHtml(profileName)}</strong></div>

                      <div style="font-size:14px;line-height:1.6;margin:0 0 14px 0;">Dear ${escapeHtml(it.candidateName)},</div>
                      <div style="font-size:14px;line-height:1.7;margin:0 0 18px 0;color:#111827;">${escapeHtml(mainMessage)}</div>

                      ${metaRows ? `
                        <div style="border:1px solid #edf0f3;border-radius:12px;padding:14px 14px 6px 14px;background:#fbfdff;">
                          <div style="font-size:14px;font-weight:800;color:#111827;margin:0 0 10px 0;">Details</div>
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">${metaRows}</table>
                        </div>` : ''
                      }

                      ${ctaHtml}
                      ${tasksHtml}

                      <div style="margin-top:18px;border:1px solid #edf0f3;border-radius:12px;padding:14px;background:#ffffff;">
                        <div style="font-size:14px;font-weight:800;color:#111827;margin:0 0 10px 0;">Instructions</div>
                        <div style="font-size:13px;line-height:1.7;color:#111827;white-space:pre-line;">${escapeHtml(instructionsText)}</div>
                      </div>

                      <div style="margin-top:22px;border-top:1px solid #edf0f3;padding-top:16px;">
                        <div style="font-size:14px;color:#111827;">Regards,</div>
                        <div style="font-size:14px;color:#111827;font-weight:700;">100acress HR Team</div>
                        <div style="font-size:12px;color:#6b7280;margin-top:10px;">This is an automated email. Please reply to this email if you have any questions.</div>
                      </div>
                    </td>
                  </tr>
                </table>

                <div style="font-family:Arial,sans-serif;color:#94a3b8;font-size:12px;margin-top:12px;">© ${new Date().getFullYear()} 100acress.com</div>
              </td>
            </tr>
          </table>
        </body>
      </html>`;

    await sendEmail(it.candidateEmail, fromAddr, [], `Invitation: ${roundText}`, html, false);

    res.json({ message: 'Invite sent', data: it });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to send invite' });
  }
});

// Complete a stage with feedback
router.post('/onboarding/:id/complete-stage', async (req, res) => {
  try {
    const { stage, feedback } = req.body || {};
    if (!stage || !['interview1','hrDiscussion'].includes(stage)) return res.status(400).json({ message: 'Invalid stage' });
    const it = await Onboarding.findById(req.params.id);
    if (!it) return res.status(404).json({ message: 'Not found' });

    const opening = it.openingId ? await Opening.findById(it.openingId).select('jobTitle jobProfile jobLocation') : null;
    const profileName = (opening?.jobTitle || opening?.jobProfile || 'this position');

    it.stageData = it.stageData || {};
    it.stageData[stage] = it.stageData[stage] || {};
    it.stageData[stage].feedback = feedback || '';
    it.stageData[stage].completedAt = new Date();
    it.stageData[stage].status = 'completed';

    // Auto-advance if appropriate
    const stageIndex = it.stages.indexOf(stage);
    if (stageIndex >= 0 && it.currentStageIndex === stageIndex && stageIndex < it.stages.length - 1) {
      it.currentStageIndex = stageIndex + 1;
      it.history.push({ stage: it.stages[it.currentStageIndex], note: 'Auto-advanced after completion' });
    }

    await it.save();

    // Send next-step email
    const next = it.stages[it.currentStageIndex];
    let subject = 'Next Step';
    let html = `
      <!doctype html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <title>Next Step - 100acress</title>
        </head>
        <body style="margin:0;padding:0;background:#f6f7fb;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f6f7fb;padding:24px 12px;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 6px 24px rgba(15,23,42,0.08);">
                  <tr>
                    <td style="padding:18px 20px;background:linear-gradient(135deg,#0ea5e9,#2563eb);">
                      <div style="font-family:Arial,sans-serif;color:#ffffff;font-size:18px;font-weight:800;letter-spacing:0.2px;">100acress.com</div>
                      <div style="font-family:Arial,sans-serif;color:#eaf2ff;font-size:13px;margin-top:4px;">HR Team</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:22px 20px;font-family:Arial,sans-serif;color:#111827;">
                      <div style="font-size:18px;font-weight:800;margin:0 0 6px 0;">Next Step</div>
                      <div style="font-size:14px;color:#6b7280;margin:0 0 6px 0;">Profile: <strong style="color:#111827;">${escapeHtml(profileName)}</strong></div>
                      <div style="font-size:14px;line-height:1.6;margin:0 0 14px 0;">Dear ${escapeHtml(it.candidateName)},</div>
                      <div style="font-size:14px;line-height:1.7;margin:0 0 18px 0;color:#111827;">Your next step is <strong style="color:#2563eb;">${escapeHtml(next)}</strong>.</div>
                      <div style="margin-top:18px;border:1px solid #edf0f3;border-radius:12px;padding:14px;background:#ffffff;">
                        <div style="font-size:14px;font-weight:800;color:#111827;margin:0 0 10px 0;">Instructions</div>
                        <div style="font-size:13px;line-height:1.7;color:#111827;white-space:pre-line;">${escapeHtml(DEFAULT_EMAIL_INSTRUCTIONS)}</div>
                      </div>
                      <div style="margin-top:22px;border-top:1px solid #edf0f3;padding-top:16px;">
                        <div style="font-size:14px;color:#111827;">Regards,</div>
                        <div style="font-size:14px;color:#111827;font-weight:700;">100acress HR Team</div>
                      </div>
                    </td>
                  </tr>
                </table>
                <div style="font-family:Arial,sans-serif;color:#94a3b8;font-size:12px;margin-top:12px;">© ${new Date().getFullYear()} 100acress.com</div>
              </td>
            </tr>
          </table>
        </body>
      </html>`;
    if (stage === 'interview1') {
      subject = `Feedback & Next Step: HR Discussion (for ${profileName})`;
      html = `
      <!doctype html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <title>Feedback & Next Step - 100acress</title>
        </head>
        <body style="margin:0;padding:0;background:#f6f7fb;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f6f7fb;padding:24px 12px;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 6px 24px rgba(15,23,42,0.08);">
                  <tr>
                    <td style="padding:18px 20px;background:linear-gradient(135deg,#0ea5e9,#2563eb);">
                      <div style="font-family:Arial,sans-serif;color:#ffffff;font-size:18px;font-weight:800;letter-spacing:0.2px;">100acress.com</div>
                      <div style="font-family:Arial,sans-serif;color:#eaf2ff;font-size:13px;margin-top:4px;">HR Team</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:22px 20px;font-family:Arial,sans-serif;color:#111827;">
                      <div style="font-size:18px;font-weight:800;margin:0 0 6px 0;">Feedback & Next Step</div>
                      <div style="font-size:14px;color:#6b7280;margin:0 0 6px 0;">Profile: <strong style="color:#111827;">${escapeHtml(profileName)}</strong></div>
                      <div style="font-size:14px;line-height:1.6;margin:0 0 14px 0;">Dear ${escapeHtml(it.candidateName)},</div>
                      <div style="font-size:14px;line-height:1.7;margin:0 0 18px 0;color:#111827;">Thank you for attending the <strong style="color:#2563eb;">Interview 1</strong>. ${feedback ? `Your feedback: ${escapeHtml(feedback)}.` : ''}</div>
                      <div style="font-size:14px;line-height:1.7;margin:0 0 18px 0;color:#111827;">Your next step is <strong style="color:#2563eb;">HR Discussion</strong>. We will send you the invite shortly.</div>
                      <div style="margin-top:18px;border:1px solid #edf0f3;border-radius:12px;padding:14px;background:#ffffff;">
                        <div style="font-size:14px;font-weight:800;color:#111827;margin:0 0 10px 0;">Instructions</div>
                        <div style="font-size:13px;line-height:1.7;color:#111827;white-space:pre-line;">${escapeHtml(DEFAULT_EMAIL_INSTRUCTIONS)}</div>
                      </div>
                      <div style="margin-top:22px;border-top:1px solid #edf0f3;padding-top:16px;">
                        <div style="font-size:14px;color:#111827;">Regards,</div>
                        <div style="font-size:14px;color:#111827;font-weight:700;">100acress HR Team</div>
                      </div>
                    </td>
                  </tr>
                </table>
                <div style="font-family:Arial,sans-serif;color:#94a3b8;font-size:12px;margin-top:12px;">© ${new Date().getFullYear()} 100acress.com</div>
              </td>
            </tr>
          </table>
        </body>
      </html>`;
    } else if (stage === 'hrDiscussion') {
      subject = `Next Step: Documentation (for ${profileName})`;
      html = `
      <!doctype html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <title>Next Step: Documentation - 100acress</title>
        </head>
        <body style="margin:0;padding:0;background:#f6f7fb;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f6f7fb;padding:24px 12px;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 6px 24px rgba(15,23,42,0.08);">
                  <tr>
                    <td style="padding:18px 20px;background:linear-gradient(135deg,#0ea5e9,#2563eb);">
                      <div style="font-family:Arial,sans-serif;color:#ffffff;font-size:18px;font-weight:800;letter-spacing:0.2px;">100acress.com</div>
                      <div style="font-family:Arial,sans-serif;color:#eaf2ff;font-size:13px;margin-top:4px;">HR Team</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:22px 20px;font-family:Arial,sans-serif;color:#111827;">
                      <div style="font-size:18px;font-weight:800;margin:0 0 6px 0;">Next Step: Documentation</div>
                      <div style="font-size:14px;color:#6b7280;margin:0 0 6px 0;">Profile: <strong style="color:#111827;">${escapeHtml(profileName)}</strong></div>
                      <div style="font-size:14px;line-height:1.6;margin:0 0 14px 0;">Dear ${escapeHtml(it.candidateName)},</div>
                      <div style="font-size:14px;line-height:1.7;margin:0 0 18px 0;color:#111827;">Thank you for attending the <strong style="color:#2563eb;">HR Discussion</strong>. ${feedback ? `Your feedback: ${escapeHtml(feedback)}.` : ''}</div>
                      <div style="font-size:14px;line-height:1.7;margin:0 0 18px 0;color:#111827;">Your next step is <strong style="color:#2563eb;">Documentation</strong>. You will receive a document upload link shortly.</div>
                      <div style="margin-top:18px;border:1px solid #edf0f3;border-radius:12px;padding:14px;background:#ffffff;">
                        <div style="font-size:14px;font-weight:800;color:#111827;margin:0 0 10px 0;">Instructions</div>
                        <div style="font-size:13px;line-height:1.7;color:#111827;white-space:pre-line;">${escapeHtml(DEFAULT_EMAIL_INSTRUCTIONS)}</div>
                      </div>
                      <div style="margin-top:22px;border-top:1px solid #edf0f3;padding-top:16px;">
                        <div style="font-size:14px;color:#111827;">Regards,</div>
                        <div style="font-size:14px;color:#111827;font-weight:700;">100acress HR Team</div>
                      </div>
                    </td>
                  </tr>
                </table>
                <div style="font-family:Arial,sans-serif;color:#94a3b8;font-size:12px;margin-top:12px;">© ${new Date().getFullYear()} 100acress.com</div>
              </td>
            </tr>
          </table>
        </body>
      </html>`;
    }
    await sendEmail(it.candidateEmail, fromAddr, [], subject, html, false);

    res.json({ message: 'Stage marked complete', data: it });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to complete stage' });
  }
});

// Send documentation invite
router.post('/onboarding/:id/docs-invite', async (req, res) => {
  try {
    const { content, uploadLink } = req.body || {};
    const it = await Onboarding.findById(req.params.id);
    if (!it) return res.status(404).json({ message: 'Not found' });

    const opening = it.openingId ? await Opening.findById(it.openingId).select('jobTitle jobProfile jobLocation') : null;
    const profileName = (opening?.jobTitle || opening?.jobProfile || 'this position');

    if (!uploadLink) {
      return res.status(400).json({ message: 'Upload link is required' });
    }

    const escapeHtml = (value) => {
      if (value === null || value === undefined) return '';
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    };

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <title>Document Verification - 100acress</title>
        </head>
        <body style="margin:0;padding:0;background:#f6f7fb;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f6f7fb;padding:24px 12px;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 6px 24px rgba(15,23,42,0.08);">
                  <tr>
                    <td style="padding:18px 20px;background:linear-gradient(135deg,#0ea5e9,#2563eb);">
                      <div style="font-family:Arial,sans-serif;color:#ffffff;font-size:18px;font-weight:800;letter-spacing:0.2px;">100acress.com</div>
                      <div style="font-family:Arial,sans-serif;color:#eaf2ff;font-size:13px;margin-top:4px;">HR Team</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:22px 20px;font-family:Arial,sans-serif;color:#111827;">
                      <div style="font-size:18px;font-weight:800;margin:0 0 6px 0;">Document Verification Required</div>
                      <div style="font-size:14px;color:#6b7280;margin:0 0 6px 0;">Profile: <strong style="color:#111827;">${escapeHtml(profileName)}</strong></div>
                      <div style="font-size:14px;line-height:1.6;margin:0 0 14px 0;">Dear ${escapeHtml(it.candidateName)},</div>
                      <div style="font-size:14px;line-height:1.7;margin:0 0 18px 0;color:#111827;">${escapeHtml(content && content.trim() ? content : 'Please upload your documents for verification.')}</div>
                      <div style="margin-top:20px;">
                        <a href="${escapeHtml(uploadLink)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-size:14px;font-weight:700;">Upload Documents</a>
                        <div style="font-size:12px;color:#6b7280;margin-top:10px;">If the button doesn't work, copy and paste this link: <span style="color:#111827;word-break:break-all;">${escapeHtml(uploadLink)}</span></div>
                      </div>
                      <div style="margin-top:18px;border:1px solid #edf0f3;border-radius:12px;padding:14px;background:#ffffff;">
                        <div style="font-size:14px;font-weight:800;color:#111827;margin:0 0 10px 0;">Instructions</div>
                        <div style="font-size:13px;line-height:1.7;color:#111827;white-space:pre-line;">${escapeHtml(content && content.trim() ? DEFAULT_EMAIL_INSTRUCTIONS : DEFAULT_EMAIL_INSTRUCTIONS)}</div>
                      </div>
                      <div style="margin-top:22px;border-top:1px solid #edf0f3;padding-top:16px;">
                        <div style="font-size:14px;color:#111827;">Regards,</div>
                        <div style="font-size:14px;color:#111827;font-weight:700;">100acress HR Team</div>
                      </div>
                    </td>
                  </tr>
                </table>
                <div style="font-family:Arial,sans-serif;color:#94a3b8;font-size:12px;margin-top:12px;">&copy; ${new Date().getFullYear()} 100acress.com</div>
              </td>
            </tr>
          </table>
        </body>
      </html>`;
    
    // Try to send email, but don't fail if email sending fails
    const emailSent = await sendEmail(it.candidateEmail, fromAddr, [], `Document Verification - ${profileName}`, html, false);
    
    // Update status regardless of email success
    it.stageData = it.stageData || {};
    it.stageData.documentation = it.stageData.documentation || {};
    it.stageData.documentation.status = 'invited';
    it.stageData.documentation.inviteSentAt = new Date();
    it.stageData.documentation.uploadLink = uploadLink; // Store link for reference
    await it.save();

    // Return success with warning if email failed
    if (!emailSent) {
      return res.json({ 
        message: 'Documentation invite prepared. Email sending failed - please share the upload link manually.',
        warning: 'Email not sent due to AWS credentials issue. Upload link generated successfully.',
        uploadLink: uploadLink,
        data: it 
      });
    }

    res.json({ message: 'Documentation invite sent successfully', data: it });
  } catch (e) {
    console.error('Error in docs-invite:', e);
    res.status(500).json({ message: 'Failed to send documentation invite: ' + e.message });
  }
});

// Verify upload token (alias for CareerController.verifyUploadToken)
// This route exists because frontend calls /api/hr/onboarding/verify-upload-token/:token
router.get('/onboarding/verify-upload-token/:token', CareerController.verifyUploadToken);

// Record a document uploaded (server-side record; actual upload handled elsewhere)
router.post('/onboarding/:id/docs', async (req, res) => {
  try {
    const { docType, url } = req.body || {};
    if (!docType || !url) return res.status(400).json({ message: 'docType and url required' });
    const it = await Onboarding.findById(req.params.id);
    if (!it) return res.status(404).json({ message: 'Not found' });

    it.documents = it.documents || [];
    it.documents.push({ docType, url, status: 'uploaded', uploadedAt: new Date() });
    await it.save();
    res.json({ message: 'Document recorded', data: it });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to record document' });
  }
});

// Record a batch of documents submitted and email under verification notice
router.post('/onboarding/:id/docs-submit', upload.fields([
  { name: 'pan', maxCount: 1 },
  { name: 'aadhaar', maxCount: 1 },
  { name: 'photo', maxCount: 1 },
  { name: 'marksheet', maxCount: 1 },
  { name: 'other1', maxCount: 1 },
  { name: 'other2', maxCount: 1 }
]), async (req, res) => {
  try {
    const it = await Onboarding.findById(req.params.id);
    if (!it) return res.status(404).json({ message: 'Not found' });

    // Handle file uploads via multer (assuming files are uploaded)
    const files = req.files || {};
    const { joiningDate } = req.body || {};

    it.documents = it.documents || [];

    // Process uploaded files
    const fileMappings = {
      pan: 'pan',
      aadhaar: 'aadhaar',
      photo: 'photo',
      marksheet: 'marksheet',
      other1: 'other',
      other2: 'other'
    };

    for (const [fieldName, docType] of Object.entries(fileMappings)) {
      if (files[fieldName] && files[fieldName][0]) {
        const file = files[fieldName][0];
        // Upload file to S3 and get the URL
        const uploadResult = await uploadFile(file);
        const fileUrl = uploadResult.Location;

        it.documents.push({
          docType,
          url: fileUrl,
          status: 'uploaded',
          uploadedAt: new Date(),
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype
        });
      }
    }

    // Set stage invited if not yet
    it.stageData = it.stageData || {};
    it.stageData.documentation = it.stageData.documentation || {};
    if (!it.stageData.documentation.status || it.stageData.documentation.status === 'pending') {
      it.stageData.documentation.status = 'invited';
    }

    // Set joining date if provided
    if (joiningDate) {
      it.joiningDate = new Date(joiningDate);
    }

    await it.save();

    const html = `<div><p>Hi ${it.candidateName},</p><p>Your documents have been received and are <strong>under verification</strong>. We will reach out if anything else is required.</p></div>`;
    await sendEmail(it.candidateEmail, fromAddr, [], 'Documents Under Verification - 100acress', html, false);

    res.json({ message: 'Documents uploaded and email sent', data: it });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to upload documents' });
  }
});

// Mark documentation verification done and (optionally) send joining mail
router.post('/onboarding/:id/docs-complete', async (req, res) => {
  try {
    const { joiningDate } = req.body || {};
    const it = await Onboarding.findById(req.params.id);
    if (!it) return res.status(404).json({ message: 'Not found' });

    it.stageData = it.stageData || {};
    it.stageData.documentation = it.stageData.documentation || {};
    it.stageData.documentation.status = 'completed';
    it.stageData.documentation.completedAt = new Date();

    // Move to success stage
    it.currentStageIndex = it.stages.length - 1;
    it.status = 'completed';

    if (joiningDate) it.joiningDate = new Date(joiningDate);
    await it.save();

    const jd = it.joiningDate ? new Date(it.joiningDate).toLocaleDateString() : null;
    const html = jd
      ? `<div><p>Hi ${it.candidateName},</p><p>Your document verification is successful.</p><p>Your joining date is <strong>${jd}</strong>. Welcome to 100acress!</p></div>`
      : `<div><p>Hi ${it.candidateName},</p><p>Your document verification is successful. We will communicate your joining date shortly.</p></div>`;
    await sendEmail(it.candidateEmail, fromAddr, [], jd ? 'Joining Details - 100acress' : 'Document Verification Successful - 100acress', html, false);

    res.json({ message: 'Documentation completed', data: it });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to complete documentation' });
  }
});

// Advance to next stage (existing)
router.post('/onboarding/:id/advance', async (req, res) => {
  try {
    const it = await Onboarding.findById(req.params.id);
    if (!it) return res.status(404).json({ message: 'Not found' });

    if (it.status === 'completed') return res.status(400).json({ message: 'Already completed' });

    const nextIndex = it.currentStageIndex + 1;
    if (nextIndex >= it.stages.length - 1) {
      // Move to success stage
      it.currentStageIndex = it.stages.length - 1;
      it.status = 'completed';
    } else {
      it.currentStageIndex = nextIndex;
    }
    it.history.push({ stage: it.stages[it.currentStageIndex], note: 'Advanced' });
    await it.save();
    res.json({ message: 'Advanced', data: it });
  } catch (e) {
    res.status(500).json({ message: 'Failed to advance stage' });
  }
});

// Set joining date (existing) + send mail
router.post('/onboarding/:id/joining', async (req, res) => {
  try {
    const { joiningDate } = req.body || {};
    if (!joiningDate) return res.status(400).json({ message: 'joiningDate required (ISO)' });
    const it = await Onboarding.findById(req.params.id);
    if (!it) return res.status(404).json({ message: 'Not found' });
    it.joiningDate = new Date(joiningDate);

    // If already on success stage, ensure completed
    if (it.currentStageIndex < it.stages.length - 1) {
      it.currentStageIndex = it.stages.length - 1;
    }
    it.status = 'completed';
    await it.save();

    const html = `<div><p>Hi ${it.candidateName},</p><p>Your joining date is set to <strong>${new Date(it.joiningDate).toLocaleDateString()}</strong>. Welcome to 100acress!</p></div>`;
    await sendEmail(it.candidateEmail, fromAddr, [], 'Joining Date - 100acress', html, false);

    res.json({ message: 'Joining date set', data: it });
  } catch (e) {
    res.status(500).json({ message: 'Failed to set joining date' });
  }
});

// Reject at a specific stage with reason and email notification
router.post('/onboarding/:id/reject-stage', async (req, res) => {
  try {
    const { stage, reason } = req.body || {};
    if (!stage || !['interview1','hrDiscussion','documentation'].includes(stage)) return res.status(400).json({ message: 'Invalid stage' });
    const it = await Onboarding.findById(req.params.id);
    if (!it) return res.status(404).json({ message: 'Not found' });

    it.stageData = it.stageData || {};
    it.stageData[stage] = it.stageData[stage] || {};
    it.stageData[stage].status = 'completed';
    it.stageData[stage].completedAt = new Date();
    it.stageData[stage].feedback = `Rejected: ${reason || 'No reason provided'}`;

    // Stop progression, mark completed to remove from active list
    it.status = 'completed';
    await it.save();

    const html = `<div><p>Hi ${it.candidateName},</p><p>Thank you for your time. After careful consideration, we will not be moving forward at this stage (${stage}).</p><p>Reason: ${reason || '—'}</p><p>We appreciate your interest and wish you all the best.</p></div>`;
    await sendEmail(it.candidateEmail, fromAddr, [], 'Application Update - 100acress', html, false);

    res.json({ message: 'Stage rejected and email sent', data: it });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to reject stage' });
  }
});

// HR: list documents for an onboarding record
router.get('/onboarding/:id/documents', async (req, res) => {
  try {
    const it = await Onboarding.findById(req.params.id);
    if (!it) return res.status(404).json({ message: 'Not found' });
    res.json({ data: it.documents || [] });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch documents' });
  }
});

// HR: update a document status/notes
router.patch('/onboarding/:id/documents/:docId', async (req, res) => {
  try {
    const { status, notes } = req.body || {};
    const it = await Onboarding.findById(req.params.id);
    if (!it) return res.status(404).json({ message: 'Not found' });
    const doc = (it.documents || []).find(d => String(d._id) === String(req.params.docId));
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    if (status) {
      doc.status = status; // 'verified' | 'rejected' | 'uploaded' | 'pending'
      if (status === 'verified') doc.verifiedAt = new Date();
    }
    if (typeof notes === 'string') doc.notes = notes;
    await it.save();
    res.json({ message: 'Updated', data: doc });
  } catch (e) {
    res.status(500).json({ message: 'Failed to update document' });
  }
});

// HR: reset onboarding to a specific stage (interview1|hrDiscussion|documentation)
router.post('/onboarding/:id/reset', async (req, res) => {
  try {
    const { stage, reason } = req.body || {};
    if (!['interview1','hrDiscussion','documentation'].includes(stage)) {
      return res.status(400).json({ message: 'Invalid stage' });
    }
    const it = await Onboarding.findById(req.params.id);
    if (!it) return res.status(404).json({ message: 'Not found' });

    const targetIndex = it.stages.indexOf(stage);
    if (targetIndex < 0) return res.status(400).json({ message: 'Stage not in workflow' });

    // Reset progress
    it.currentStageIndex = targetIndex;
    it.status = 'in_progress';
    // Optionally clear documentation stage data and downstream
    if (stage === 'documentation') {
      // keep existing docs but set not verified
      (it.documents || []).forEach(d => { if (d.status === 'verified') d.status = 'uploaded'; });
    }
    if (!it.history) it.history = [];
    it.history.push({ stage, note: `Reset by HR${reason ? ' - ' + reason : ''}`, movedAt: new Date() });
    await it.save();

    // Notify candidate
    const siteUrl = process.env.SITE_URL || 'https://100acress.com';
    const fromAddr = process.env.SES_FROM || process.env.SMTP_FROM || process.env.SMTP_USER || 'hr@100acress.com';
    const { sendEmail } = require('../Utilities/s3HelperUtility');
    const labelMap = { interview1: 'Interview 1', hrDiscussion: 'HR Discussion', documentation: 'Documentation' };
    const html = `<div style="font-family:Arial;color:#111;padding:16px"><h3>Onboarding Update</h3><p>Hi ${it.candidateName},</p><p>Your onboarding has been reset to <strong>${labelMap[stage]}</strong>${reason ? ' due to: ' + reason : ''}. Our team will reach out with next steps.</p><p><a href="${siteUrl}" style="background:#2563eb;color:#fff;padding:8px 12px;border-radius:6px;text-decoration:none">Visit 100acress</a></p></div>`;
    await sendEmail(it.candidateEmail, fromAddr, [], 'Onboarding Reset - 100acress', html, false);

    res.json({ message: 'Onboarding reset', data: it });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to reset onboarding' });
  }
});

// Get employees who have completed onboarding
router.get('/employees', async (req, res) => {
  try {
    const completedOnboardings = await Onboarding.find({ status: 'completed' }).populate('applicationId', 'name email');
    const employees = completedOnboardings.map(onb => ({
      id: onb._id,
      name: onb.candidateName,
      email: onb.candidateEmail,
      joiningDate: onb.joiningDate,
      onboardingCompleted: true
    }));
    res.json({ data: employees });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to fetch employees' });
  }
});

// Offboarding routes
const Offboarding = require('../models/hr/offboarding'); // Assume we create this model

router.get('/offboarding', async (req, res) => {
  try {
    const list = await Offboarding.find({}).sort({ createdAt: -1 });
    res.json({ data: list });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch offboarding list' });
  }
});

router.post('/offboarding/start', async (req, res) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) return res.status(400).json({ message: 'employeeId required' });

    // Find the completed onboarding to get employee details
    const onboarding = await Onboarding.findById(employeeId).populate('applicationId', 'name email');
    if (!onboarding || onboarding.status !== 'completed') {
      return res.status(404).json({ message: 'Employee not found or onboarding not completed' });
    }

    // Check if offboarding already exists
    const existing = await Offboarding.findOne({ employeeId });
    if (existing) return res.status(400).json({ message: 'Offboarding already started' });

    const offboardingStages = ["exitDiscussion", "assetReturn", "documentation", "finalSettlement", "success"];

    const newOffboarding = new Offboarding({
      employeeId,
      employeeName: onboarding.candidateName,
      employeeEmail: onboarding.candidateEmail,
      stages: offboardingStages,
      currentStageIndex: 0,
      status: 'pending'
    });

    await newOffboarding.save();
    res.json({ message: 'Offboarding started', data: newOffboarding });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to start offboarding' });
  }
});

router.post('/offboarding/:id/advance', async (req, res) => {
  try {
    const it = await Offboarding.findById(req.params.id);
    if (!it) return res.status(404).json({ message: 'Not found' });

    if (it.status === 'completed') return res.status(400).json({ message: 'Already completed' });

    const nextIndex = it.currentStageIndex + 1;
    if (nextIndex >= it.stages.length - 1) {
      it.currentStageIndex = it.stages.length - 1;
      it.status = 'completed';
    } else {
      it.currentStageIndex = nextIndex;
    }
    await it.save();
    res.json({ message: 'Advanced', data: it });
  } catch (e) {
    res.status(500).json({ message: 'Failed to advance' });
  }
});

router.post('/offboarding/:id/last-working', async (req, res) => {
  try {
    const { lastWorkingDate } = req.body;
    if (!lastWorkingDate) return res.status(400).json({ message: 'lastWorkingDate required' });
    const it = await Offboarding.findById(req.params.id);
    if (!it) return res.status(404).json({ message: 'Not found' });
    it.lastWorkingDate = new Date(lastWorkingDate);
    await it.save();
    res.json({ message: 'Last working date set', data: it });
  } catch (e) {
    res.status(500).json({ message: 'Failed to set last working date' });
  }
});

router.post('/offboarding/:id/invite', async (req, res) => {
  try {
    const { stage, type, scheduledAt, endsAt, meetingLink, location, content } = req.body;
    if (!stage || !type) return res.status(400).json({ message: 'stage and type required' });
    const it = await Offboarding.findById(req.params.id);
    if (!it) return res.status(404).json({ message: 'Not found' });

    // Simple email send (similar to onboarding)
    const html = `
      <div style="font-family:Arial,sans-serif;color:#111">
        <h2>Offboarding Invitation - ${stage}</h2>
        <p>Dear ${it.employeeName},</p>
        <p>${content || 'You are invited for the next step in offboarding.'}</p>
        ${scheduledAt ? `<p><strong>Schedule:</strong> ${new Date(scheduledAt).toLocaleString()}${endsAt ? ' - ' + new Date(endsAt).toLocaleString() : ''}</p>` : ''}
        ${type === 'online' && meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>` : ''}
        ${type === 'offline' && location ? `<p><strong>Location:</strong> ${location}</p>` : ''}
      </div>`;
    await sendEmail(it.employeeEmail, fromAddr, [], `Invitation: ${stage}`, html, false);

    res.json({ message: 'Invite sent' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to send invite' });
  }
});

router.post('/offboarding/:id/complete-stage', async (req, res) => {
  try {
    const { stage, feedback } = req.body;
    if (!stage) return res.status(400).json({ message: 'stage required' });
    const it = await Offboarding.findById(req.params.id);
    if (!it) return res.status(404).json({ message: 'Not found' });

    // Mark stage as completed (simple implementation)
    await it.save();
    res.json({ message: 'Stage completed', data: it });
  } catch (e) {
    res.status(500).json({ message: 'Failed to complete stage' });
  }
});

router.post('/offboarding/:id/record-document', async (req, res) => {
  try {
    const { docType, url } = req.body;
    if (!docType || !url) return res.status(400).json({ message: 'docType and url required' });
    const it = await Offboarding.findById(req.params.id);
    if (!it) return res.status(404).json({ message: 'Not found' });

    it.documents = it.documents || [];
    it.documents.push({ docType, url, recordedAt: new Date() });
    await it.save();
    res.json({ message: 'Document recorded', data: it });
  } catch (e) {
    res.status(500).json({ message: 'Failed to record document' });
  }
});

router.post('/offboarding/:id/complete-offboarding', async (req, res) => {
  try {
    const it = await Offboarding.findById(req.params.id);
    if (!it) return res.status(404).json({ message: 'Not found' });

    if (it.status === 'completed') return res.status(400).json({ message: 'Already completed' });

    it.currentStageIndex = it.stages.length - 1;
    it.status = 'completed';
    await it.save();

    // Send completion email with document URLs
    const docUrls = it.documents.map(doc => `${doc.docType}: ${doc.url}`).join('\n');
    const html = `
      <div style="font-family:Arial,sans-serif;color:#111">
        <h2>Offboarding Completed</h2>
        <p>Dear ${it.employeeName},</p>
        <p>Your offboarding process has been completed successfully.</p>
        <p><strong>Resignation Date:</strong> ${it.lastWorkingDate ? new Date(it.lastWorkingDate).toLocaleDateString() : 'N/A'}</p>
        <p><strong>Documents:</strong></p>
        <pre>${docUrls}</pre>
        <p>Regards,<br/>100acress HR Team</p>
      </div>`;
    await sendEmail(it.employeeEmail, fromAddr, [], 'Offboarding Completed - 100acress', html, false);

    res.json({ message: 'Offboarding completed and email sent', data: it });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to complete offboarding' });
  }
});

// Stubs for HR Management module
router.get('/onboarding/candidates', (req, res) => res.status(501).json({ message: 'Not implemented' }));
router.post('/onboarding/:candidateId/start', (req, res) => res.status(501).json({ message: 'Not implemented' }));
router.get('/onboarding/instances/:id', (req, res) => res.status(501).json({ message: 'Not implemented' }));
router.get('/onboarding/instances/:id/tasks', (req, res) => res.status(501).json({ message: 'Not implemented' }));
router.patch('/onboarding/tasks/:taskId', (req, res) => res.status(501).json({ message: 'Not implemented' }));

router.get('/offboarding/queue', (req, res) => res.status(501).json({ message: 'Not implemented' }));
router.get('/offboarding/instances/:id', (req, res) => res.status(501).json({ message: 'Not implemented' }));
router.patch('/offboarding/tasks/:taskId', (req, res) => res.status(501).json({ message: 'Not implemented' }));

router.post('/it/access/:employeeId/provision', (req, res) => res.status(501).json({ message: 'Not implemented' }));
router.post('/it/access/:employeeId/revoke', (req, res) => res.status(501).json({ message: 'Not implemented' }));

router.post('/accounts/fnf/:instanceId/calc', (req, res) => res.status(501).json({ message: 'Not implemented' }));
router.post('/accounts/fnf/:instanceId/approve', (req, res) => res.status(501).json({ message: 'Not implemented' }));
// Leave Request routes (TEST - no auth required for testing)
// Apply for leave (employee) - TEST ENDPOINT
router.post('/leave/apply/test', async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Get the logged-in user from the token (if provided)
    let employee = null;
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(" ")[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "aman123");
        employee = await require('../models/register/registerModel').findById(decoded.user_id);
      } catch (error) {
        console.log('Token verification failed, using mock data for testing');
      }
    }

    // If no valid token, create a mock employee for testing
    if (!employee) {
      const mongoose = require('mongoose');
      employee = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Test User (No Auth)',
        email: 'test@example.com',
        authorized: true
      };
    }

    const leaveRequest = new LeaveRequest({
      employeeId: employee._id,
      employeeName: employee.name,
      employeeEmail: employee.email,
      leaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
    });

    await leaveRequest.save();

    // Email sending removed - will be sent only on approval/rejection

    res.json({ message: 'Test leave request submitted successfully', data: leaveRequest });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to submit test leave request' });
  }
});

// Get all leave requests (HR only) - with employee data populated
router.get('/leave', async (req, res) => {
  try {
    console.log('Fetching leave requests for HR user:', req.user?.id);

    const leaveRequests = await LeaveRequest.find({})
      .populate({
        path: 'employeeId',
        select: 'name email',
        model: 'postproperties' // Correct model name
      })
      .sort({ appliedAt: -1 });

    console.log('Found leave requests:', leaveRequests.length);

    // Transform the data to include employee name and email in the main object
    const transformedRequests = leaveRequests.map(request => {
      const employeeData = request.employeeId;
      return {
        ...request.toObject(),
        employeeName: employeeData?.name || request.employeeName || 'Unknown Employee',
        employeeEmail: employeeData?.email || request.employeeEmail || 'unknown@example.com',
        employeeId: request.employeeId?._id || request.employeeId // Keep the original employeeId
      };
    });

    console.log('Transformed requests:', transformedRequests.length);
    res.json({ data: transformedRequests });
  } catch (e) {
    console.error('Error in GET /api/hr/leave:', e);
    res.status(500).json({ message: 'Failed to fetch leave requests', error: e.message });
  }
});

// Approve or reject leave request (HR only) - temporarily no auth for testing
router.patch('/leave/:id/review', async (req, res) => {
  try {
    const { status, hrComments } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const leaveRequest = await LeaveRequest.findById(req.params.id);
    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    leaveRequest.status = status;
    leaveRequest.hrComments = hrComments || '';
    leaveRequest.reviewedAt = new Date();
    // Temporarily remove reviewedBy for testing
    // leaveRequest.reviewedBy = req.user?.id;

    await leaveRequest.save();

    // Send email to employee
    const subject = status === 'approved' ? 'Leave Request Approved' : 'Leave Request Rejected';
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #111; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
            ${status === 'approved' ? '✅ Leave Approved!' : '❌ Leave Rejected'}
          </h1>
        </div>

        <!-- Content -->
        <div style="padding: 40px;">
          <p style="font-size: 18px; color: #333; margin-bottom: 20px;">
            Dear <strong>${leaveRequest.employeeName}</strong>,
          </p>

          <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 25px;">
            Your leave request has been <strong>${status}</strong> by the HR team.
          </p>

          <!-- Leave Details -->
          <div style="background-color: #f8f9fa; border-left: 4px solid ${status === 'approved' ? '#28a745' : '#dc3545'}; padding: 20px; margin-bottom: 25px; border-radius: 6px;">
            <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">Leave Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: 500;">Leave Type:</td>
                <td style="padding: 8px 0; color: #333;">${leaveRequest.leaveType}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: 500;">Duration:</td>
                <td style="padding: 8px 0; color: #333;">${new Date(leaveRequest.startDate).toLocaleDateString()} - ${new Date(leaveRequest.endDate).toLocaleDateString()}</td>
              </tr>
              ${hrComments ? `
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: 500;">HR Comments:</td>
                <td style="padding: 8px 0; color: #333;">${hrComments}</td>
              </tr>` : ''}
            </table>
          </div>

          <!-- Website Link -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://www.100acress.com" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 25px; font-weight: 600; font-size: 16px; transition: transform 0.2s;">
              Visit 100acress.com
            </a>
          </div>

          <p style="font-size: 16px; color: #555; line-height: 1.6;">
            For any questions or concerns, please don't hesitate to contact the HR team.
          </p>

          <p style="font-size: 16px; color: #555;">
            Best regards,<br>
            <strong>100acress HR Team</strong>
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="margin: 0; color: #666; font-size: 14px;">
            © 2025 100acress. All rights reserved.
          </p>
        </div>
      </div>`;

    await sendEmail(leaveRequest.employeeEmail, fromAddr, [], `${subject} - 100acress`, html, false);

    res.json({ message: `Leave request ${status}`, data: leaveRequest });
  } catch (e) {
    console.error('Error in PATCH /api/hr/leave/:id/review:', e);
    res.status(500).json({ message: 'Failed to review leave request', error: e.message });
  }
});

// HR Management routes - Get all users
router.get('/users', hrAdminVerify, HrController.getAllUsers);

// HR Management routes - Update user authorization status
router.post('/user/:id/status', hrAdminVerify, HrController.updateUserStatus);

// Test endpoint to verify user exists
router.get('/user/:id/test', hrAdminVerify, HrController.testUserExists);

// HR Management routes - Leave requests
router.get('/leave-requests', adminVerify, HrController.getAllLeaveRequests);
router.post('/leave/:id/status', adminVerify, HrController.updateLeaveStatus);
router.get('/leave/stats', adminVerify, HrController.getLeaveStats);

router.post('/accounts/fnf/:instanceId/pay', (req, res) => res.status(501).json({ message: 'Not implemented' }));

module.exports = router;
