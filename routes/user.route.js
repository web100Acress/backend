const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

// Import actual models from the codebase
// User records with embedded postProperty array live in models/postProperty/post.js
const PostUser = require("../models/postProperty/post");
// Some environments may also store users in register/registerModel.js
const RegisterUser = require("../models/register/registerModel");

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Access token required' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false,
        message: 'Invalid or expired token' 
      });
    }
    req.user = user;
    next();
  });
};

// Admin authorization middleware
const requireAdmin = (req, res, next) => {
  // Accept both 'admin' and 'Admin' roles
  if (req.user && (req.user.role === 'admin' || req.user.role === 'Admin')) {
    next();
  } else {
    return res.status(403).json({ 
      success: false,
      message: 'Admin access required' 
    });
  }
};

/**
 * DELETE /postPerson/deleteUser/:id
 * REAL DATABASE DELETION - Permanently removes user and all associated data
 */
router.delete('/postPerson/deleteUser/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    console.log(`🗑️ Admin ${req.user.email || req.user.id} attempting to delete user: ${userId}`);

    // Validate user ID format (MongoDB ObjectId)
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    // Try in postProperty collection first
    let userToDelete = await PostUser.findById(userId);
    let source = 'postProperty';

    // Fallback: try in RegisterData collection
    if (!userToDelete) {
      userToDelete = await RegisterUser.findById(userId);
      source = 'register';
    }

    if (!userToDelete) {
      return res.status(404).json({
        success: false,
        message: 'User not found in database'
      });
    }

    console.log(`📋 Found user to delete [${source}]: ${userToDelete.name || userToDelete.email} (${userToDelete.email || 'no-email'})`);

    // Determine embedded property count if from postProperty model
    const embeddedCount = source === 'postProperty' && Array.isArray(userToDelete.postProperty)
      ? userToDelete.postProperty.length
      : 0;

    // Delete from the correct collection
    const Model = source === 'postProperty' ? PostUser : RegisterUser;
    const deletedUser = await Model.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete user from database'
      });
    }

    console.log(`✅ Successfully deleted user from [${source}] database: ${(deletedUser.name) || deletedUser.email} and ${embeddedCount} embedded properties`);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'User permanently deleted from database',
      data: {
        deletedUser: {
          id: deletedUser._id,
          name: deletedUser.name || '',
          email: deletedUser.email || '',
          mobile: deletedUser.mobile || ''
        },
        deletedPropertiesCount: embeddedCount,
        source,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Database deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Critical error during database deletion',
      error: process.env.NODE_ENV !== 'production' ? (error && error.message) : 'Internal server error'
    });
  }
});

/**
 * Alternative endpoint for user deletion
 */
router.delete('/postPerson/userDelete/:id', authenticateToken, requireAdmin, async (req, res) => {
  // Redirect to main deletion endpoint
  req.url = `/postPerson/deleteUser/${req.params.id}`;
  return router.handle(req, res);
});

/**
 * Admin endpoint for user deletion
 */
router.delete('/admin/user/delete/:id', authenticateToken, requireAdmin, async (req, res) => {
  // Redirect to main deletion endpoint
  req.url = `/postPerson/deleteUser/${req.params.id}`;
  return router.handle(req, res);
});

module.exports = router;

// --- Role update endpoint ---
// PATCH /postPerson/users/:id/role
// Updates a user's role in the RegisterData collection
router.patch('/postPerson/users/:id/role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body || {};

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }

    // Validate role
    const allowedRoles = new Set(['user', 'blog', 'admin', 'agent', 'owner', 'builder']);
    if (!role || !allowedRoles.has(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role value' });
    }

    // Update role in RegisterUser (primary user store for auth)
    const updated = await RegisterUser.findByIdAndUpdate(
      userId,
      { $set: { role } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Role updated successfully',
      data: {
        id: updated._id,
        name: updated.name,
        email: updated.email,
        mobile: updated.mobile,
        role: updated.role,
        updatedAt: updated.updatedAt,
      }
    });
  } catch (err) {
    console.error('Failed to update role:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
