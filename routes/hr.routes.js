const express = require('express');
const router = express.Router();
const Onboarding = require('../models/hr/onboarding');
const Application = require('../models/career/application');
const { sendEmail, uploadFile } = require('../Utilities/s3HelperUtility');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Helper: simple sender
const fromAddr = process.env.SES_FROM || process.env.SMTP_FROM || process.env.SMTP_USER || 'hr@100acress.com';

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

    it.stageData = it.stageData || {};
    const payload = { type, tasks, scheduledAt, endsAt, meetingLink, location, content, sentAt: new Date() };
    it.stageData[stage] = it.stageData[stage] || {};
    it.stageData[stage].invite = payload;
    it.stageData[stage].status = 'invited';
    await it.save();

    const taskList = tasks?.length ? (`<ul>${tasks.map(t => `<li><strong>${t.title || ''}</strong> - due: ${t.dueAt ? new Date(t.dueAt).toLocaleString() : 'N/A'}<br/>${t.description || ''}</li>`).join('')}</ul>`) : '';
    const scheduleLine = scheduledAt ? `<p><strong>Schedule:</strong> ${new Date(scheduledAt).toLocaleString()}${endsAt ? ' - ' + new Date(endsAt).toLocaleString() : ''}</p>` : '';
    const linkLine = type === 'online' && meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>` : '';
    const locLine = type === 'offline' && location ? `<p><strong>Location:</strong> ${location}</p>` : '';

    const html = `
      <div style="font-family:Arial,sans-serif;color:#111">
        <h2>Interview Invitation - ${stage === 'interview1' ? 'First Interview' : 'HR Discussion'}</h2>
        <p>Dear ${it.candidateName},</p>
        <p>${content || 'You are invited for the next step in our hiring process.'}</p>
        ${scheduleLine}
        ${linkLine}
        ${locLine}
        ${taskList}
        <p>Regards,<br/>100acress HR Team</p>
      </div>`;

    await sendEmail(it.candidateEmail, fromAddr, [], `Invitation: ${stage === 'interview1' ? 'First Interview' : 'HR Discussion'}`, html, false);

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
    let html = `<p>Hi ${it.candidateName}, next step is ${next}.</p>`;
    if (stage === 'interview1') {
      subject = 'Feedback & Next Step: HR Discussion';
      html = `<div><p>Hi ${it.candidateName},</p><p>Interview 1 feedback: ${feedback || '—'}.</p><p>Next step is HR Discussion. We will send you the invite shortly.</p></div>`;
    } else if (stage === 'hrDiscussion') {
      subject = 'Next Step: Documentation';
      html = `<div><p>Hi ${it.candidateName},</p><p>HR Discussion feedback: ${feedback || '—'}.</p><p>Next step is Documentation. You will receive a document upload link.</p></div>`;
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

    const html = `
      <div style="font-family:Arial,sans-serif;color:#111">
        <h2>Documentation Required</h2>
        <p>Dear ${it.candidateName},</p>
        <p>${content || 'Please upload your documents for verification.'}</p>
        <p><a href="${uploadLink || '#'}" style="display:inline-block;padding:10px 14px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none">Upload Documents</a></p>
      </div>`;
    await sendEmail(it.candidateEmail, fromAddr, [], 'Document Verification - 100acress', html, false);

    it.stageData = it.stageData || {};
    it.stageData.documentation = it.stageData.documentation || {};
    it.stageData.documentation.status = 'invited';
    await it.save();

    res.json({ message: 'Documentation invite sent', data: it });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to send documentation invite' });
  }
});

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
router.post('/accounts/fnf/:instanceId/pay', (req, res) => res.status(501).json({ message: 'Not implemented' }));

module.exports = router;
