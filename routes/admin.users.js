const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Models
const EnquiryUser = require('../models/projectDetail/user');

// Simple auth middlewares (duplicate kept local for isolation)
const jwt = require('jsonwebtoken');
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Access token required' });
  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};
const requireAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'Admin')) return next();
  return res.status(403).json({ success: false, message: 'Admin access required' });
};

// GET /api/admin/users - list enquiry users (server-side pagination)
router.get('/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '25', 10), 1), 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      EnquiryUser.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      EnquiryUser.countDocuments({})
    ]);

    return res.status(200).json({
      success: true,
      data: items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('List admin users failed:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PATCH /api/admin/users/:id/status - update enquiry status
router.patch('/admin/users/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }

    const allowed = new Set(['Pending', 'In Progress', 'Closed']);
    if (!status || !allowed.has(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const updated = await EnquiryUser.findByIdAndUpdate(id, { $set: { status } }, { new: true }).lean();
    if (!updated) return res.status(404).json({ success: false, message: 'User not found' });

    // Emit socket event
    const io = req.app.get('io');
    io && io.emit('admin:users:update', { type: 'status', id, status, updatedAt: new Date().toISOString() });

    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error('Update status failed:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/admin/users/:id - delete an enquiry
router.delete('/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }

    const deleted = await EnquiryUser.findByIdAndDelete(id).lean();
    if (!deleted) return res.status(404).json({ success: false, message: 'User not found' });

    // Emit socket event
    const io = req.app.get('io');
    io && io.emit('admin:users:update', { type: 'delete', id, deletedAt: new Date().toISOString() });

    return res.status(200).json({ success: true, data: { id } });
  } catch (err) {
    console.error('Delete user failed:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Optional: POST /api/admin/users (for manual test-inserts)
router.post('/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const payload = req.body || {};
    const created = await EnquiryUser.create(payload);

    // Emit socket event
    const io = req.app.get('io');
    io && io.emit('admin:users:update', { type: 'create', id: created._id.toString(), item: created });

    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    console.error('Create user failed:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
