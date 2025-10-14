const express = require('express');
const router = express.Router();
const Onboarding = require('../models/hr/onboarding');
const Application = require('../models/career/application');

// Helper: ensure onboarding exists for all approved applications
async function syncApprovedApplications() {
  const approved = await Application.find({ status: 'approved' });
  const byAppId = new Map(approved.map(a => [String(a._id), a]));
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
  if (toCreate.length) {
    await Onboarding.insertMany(toCreate);
  }
  return { created: toCreate.length, totalApproved: approved.length };
}

// Manual sync endpoint
router.post('/onboarding/sync', async (req, res) => {
  try {
    const result = await syncApprovedApplications();
    res.json({ message: 'Sync complete', ...result });
  } catch (e) {
    res.status(500).json({ message: 'Sync failed' });
  }
});

// List onboarding candidates (auto-sync before listing)
router.get('/onboarding', async (req, res) => {
  try {
    await syncApprovedApplications();
    const list = await Onboarding.find({}).sort({ createdAt: -1 });
    res.json({ data: list });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch onboarding list' });
  }
});

// Get onboarding by id
router.get('/onboarding/:id', async (req, res) => {
  try {
    const it = await Onboarding.findById(req.params.id);
    if (!it) return res.status(404).json({ message: 'Not found' });
    res.json({ data: it });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch onboarding' });
  }
});

// Advance to next stage
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

// Set joining date
router.post('/onboarding/:id/joining', async (req, res) => {
  try {
    const { joiningDate } = req.body || {};
    if (!joiningDate) return res.status(400).json({ message: 'joiningDate required (ISO)' });
    const it = await Onboarding.findById(req.params.id);
    if (!it) return res.status(404).json({ message: 'Not found' });
    it.joiningDate = new Date(joiningDate);
    await it.save();
    res.json({ message: 'Joining date set', data: it });
  } catch (e) {
    res.status(500).json({ message: 'Failed to set joining date' });
  }
});

// Stubs for HR Management module
router.get('/onboarding/candidates', (req, res) => res.status(501).json({ message: 'Not implemented' }));
router.post('/onboarding/:candidateId/start', (req, res) => res.status(501).json({ message: 'Not implemented' }));
router.get('/onboarding/instances/:id', (req, res) => res.status(501).json({ message: 'Not implemented' }));
router.get('/onboarding/instances/:id/tasks', (req, res) => res.status(501).json({ message: 'Not implemented' }));
router.patch('/onboarding/tasks/:taskId', (req, res) => res.status(501).json({ message: 'Not implemented' }));

router.get('/offboarding/queue', (req, res) => res.status(501).json({ message: 'Not implemented' }));
router.post('/offboarding/:employeeId/start', (req, res) => res.status(501).json({ message: 'Not implemented' }));
router.get('/offboarding/instances/:id', (req, res) => res.status(501).json({ message: 'Not implemented' }));
router.patch('/offboarding/tasks/:taskId', (req, res) => res.status(501).json({ message: 'Not implemented' }));

router.post('/it/access/:employeeId/provision', (req, res) => res.status(501).json({ message: 'Not implemented' }));
router.post('/it/access/:employeeId/revoke', (req, res) => res.status(501).json({ message: 'Not implemented' }));

router.post('/accounts/fnf/:instanceId/calc', (req, res) => res.status(501).json({ message: 'Not implemented' }));
router.post('/accounts/fnf/:instanceId/approve', (req, res) => res.status(501).json({ message: 'Not implemented' }));
router.post('/accounts/fnf/:instanceId/pay', (req, res) => res.status(501).json({ message: 'Not implemented' }));

module.exports = router;
