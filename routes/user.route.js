const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

// Import actual models from the codebase
// User records with embedded postProperty array live in models/postProperty/post.js
const User = require("../models/postProperty/post");

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
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID format' 
      });
    }

    // Check if user exists before deletion
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found in database' 
      });
    }

    console.log(`📋 Found user to delete: ${userToDelete.name} (${userToDelete.email})`);

    // Determine how many embedded properties will be removed (postProperty is embedded in user)
    const embeddedCount = Array.isArray(userToDelete.postProperty) ? userToDelete.postProperty.length : 0;

    // Delete the user document (removes embedded properties as well)
    const deletedUser = await User.findByIdAndDelete(userId);
    
    if (!deletedUser) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to delete user from database' 
      });
    }

    // Log successful deletion
    console.log(`✅ Successfully deleted user from database: ${deletedUser.name} and ${embeddedCount} embedded properties`);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'User permanently deleted from database',
      data: {
        deletedUser: {
          id: deletedUser._id,
          name: deletedUser.name,
          email: deletedUser.email,
          mobile: deletedUser.mobile
        },
        deletedPropertiesCount: embeddedCount,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Database deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Critical error during database deletion',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
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
  