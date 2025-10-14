const express = require('express');
const router = express.Router();
const Onboarding = require('../models/hr/onboarding');

// List onboarding candidates
router.get('/onboarding', async (req, res) => {
  try {
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
