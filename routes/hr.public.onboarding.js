const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Onboarding = require('../models/hr/onboarding');
const OnboardingToken = require('../models/hr/onboardingToken');
const { uploadFile, sendEmail } = require('../Utilities/s3HelperUtility');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const fromAddr = process.env.SES_FROM || process.env.SMTP_FROM || process.env.SMTP_USER || 'hr@100acress.com';
const siteUrl = process.env.SITE_URL || 'https://100acress.com';

// HR endpoint to generate token and send email (secured upstream via hrAdminVerify when mounted)
router.post('/internal/generate-link/:onboardingId', async (req, res) => {
  try {
    const { onboardingId } = req.params;
    const { expiresInHours = 48 } = req.body || {};
    const it = await Onboarding.findById(onboardingId);
    if (!it) return res.status(404).json({ message: 'Onboarding not found' });

    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + Number(expiresInHours) * 3600 * 1000);
    await OnboardingToken.create({ onboardingId: it._id, candidateEmail: it.candidateEmail, token, expiresAt });

    const link = `${siteUrl}/onboarding/upload?token=${token}`;
    const html = `
      <div style="font-family:Arial,sans-serif;color:#111;background:#f7fafc;padding:24px;">
        <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,0.06)">
          <div style="background:#2563eb;color:#fff;padding:18px 24px;font-weight:700;font-size:18px">100acress — Upload Your Onboarding Documents</div>
          <div style="padding:24px;line-height:1.6">
            <p>Hi ${it.candidateName},</p>
            <p>Welcome to 100acress! Please upload your onboarding documents using the secure link below. This link is <strong>single-use</strong> and will expire in <strong>${expiresInHours} hours</strong>.</p>
            <p style="margin:20px 0"><a href="${link}" style="background:#16a34a;color:#fff;padding:12px 16px;border-radius:8px;text-decoration:none;font-weight:600">Upload Documents</a></p>
            <p>If the button doesn't work, copy this URL:<br/><a href="${link}">${link}</a></p>
          </div>
          <div style="background:#f9fafb;color:#6b7280;padding:14px 24px;font-size:12px">© 100acress • <a href="${siteUrl}" style="color:#2563eb;text-decoration:none">100acress.com</a></div>
        </div>
      </div>`;
    await sendEmail(it.candidateEmail, fromAddr, [], '100acress Onboarding - Upload Documents', html, false);

    res.json({ message: 'Link generated and email sent' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to generate link' });
  }
});

// Public: validate token
router.get('/validate', async (req, res) => {
  try {
    const { token } = req.query || {};
    if (!token) return res.status(400).json({ message: 'token required' });
    const t = await OnboardingToken.findOne({ token });
    if (!t) return res.status(404).json({ message: 'Invalid token' });
    const used = !!t.usedAt;
    const expired = t.expiresAt < new Date();
    const it = await Onboarding.findById(t.onboardingId);
    if (!it) return res.status(404).json({ message: 'Onboarding not found' });
    return res.json({ message: 'ok', data: { candidateName: it.candidateName, candidateEmail: it.candidateEmail, used, expired } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed' });
  }
});

// Public: candidate summary (read-only)
router.get('/summary', async (req, res) => {
  try {
    const { token } = req.query || {};
    if (!token) return res.status(400).json({ message: 'token required' });
    const t = await OnboardingToken.findOne({ token });
    if (!t) return res.status(404).json({ message: 'Invalid token' });
    const it = await Onboarding.findById(t.onboardingId);
    if (!it) return res.status(404).json({ message: 'Onboarding not found' });
    const docs = (it.documents || []).map(d => ({ docType: d.docType, status: d.status }));
    const status = it.status;
    const joiningDate = it.joiningDate;
    res.json({ message: 'ok', data: { docs, status, joiningDate } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed' });
  }
});

// Public: upload files (multipart)
router.post('/upload', upload.fields([
  { name: 'aadhaar', maxCount: 1 },
  { name: 'pan', maxCount: 1 },
  { name: 'resume', maxCount: 1 },
  { name: 'photo', maxCount: 1 },
  { name: 'certificates', maxCount: 10 },
]), async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ message: 'token required' });
    const t = await OnboardingToken.findOne({ token });
    if (!t || t.usedAt || t.expiresAt < new Date()) return res.status(410).json({ message: 'Invalid or expired token' });

    const it = await Onboarding.findById(t.onboardingId);
    if (!it) return res.status(404).json({ message: 'Onboarding not found' });

    const addDoc = async (docType, file) => {
      if (!file) return;
      const up = await uploadFile(file);
      it.documents.push({ docType, url: up.Location, status: 'uploaded', uploadedAt: new Date() });
    };

    it.documents = it.documents || [];
    await addDoc('aadhaar', req.files?.aadhaar?.[0]);
    await addDoc('pan', req.files?.pan?.[0]);
    await addDoc('resume', req.files?.resume?.[0]);
    await addDoc('photo', req.files?.photo?.[0]);
    if (Array.isArray(req.files?.certificates)) {
      for (const f of req.files.certificates) await addDoc('certificate', f);
    }

    // Mark token used
    t.usedAt = new Date();
    await t.save();

    // Notify HR and candidate
    const hrHtml = `<div style="font-family:Arial;color:#111;padding:16px"><h3>New Onboarding Upload</h3><p>${it.candidateName} (${it.candidateEmail}) submitted documents.</p><p><a href="${siteUrl}/hr/onboarding" style="background:#2563eb;color:#fff;padding:8px 12px;border-radius:6px;text-decoration:none">View Onboarding</a></p></div>`;
    const candHtml = `<div style="font-family:Arial;color:#111;padding:16px"><h3>Documents Received</h3><p>Hi ${it.candidateName}, your documents are under verification. We will update you shortly.</p><p><a href="${siteUrl}" style="background:#16a34a;color:#fff;padding:8px 12px;border-radius:6px;text-decoration:none">Visit 100acress</a></p></div>`;
    await sendEmail(fromAddr, fromAddr, [], 'New Onboarding Upload', hrHtml, false);
    await sendEmail(it.candidateEmail, fromAddr, [], 'Documents Under Verification - 100acress', candHtml, false);

    await it.save();
    res.json({ message: 'Uploaded and submitted' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Upload failed' });
  }
});

module.exports = router;
