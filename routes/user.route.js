const express = require("express");
const cors = require("cors");
const router = express.Router();
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const adminVerify = require("../middleware/adminVerify");
const upload = require("../aws/multerConfig");
const path = require("path");
const fs = require("fs");
const { uploadFile } = require("../aws/s3Helper");

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

  const trySecrets = [process.env.JWT_SECRET, 'amitchaudhary100', 'your_jwt_secret'].filter(Boolean);
  let verifiedUser = null;
  let lastErr = null;
  for (const secret of trySecrets) {
    try {
      verifiedUser = jwt.verify(token, secret);
      break;
    } catch (e) {
      lastErr = e;
      continue;
    }
  }
  if (!verifiedUser) {
    // Structured error for quick debugging (no sensitive data)
    try { console.warn('[auth] JWT verify failed:', { name: lastErr && lastErr.name, message: lastErr && lastErr.message, url: req.originalUrl, method: req.method }); } catch {}
    return res.status(403).json({ 
      success: false,
      message: 'Invalid or expired token',
      ...(process.env.NODE_ENV !== 'production' ? { error: lastErr && lastErr.name, errorMessage: lastErr && lastErr.message } : {})
    });
  }
  req.user = verifiedUser;
  next();
};

/**
 * POST /users/:id/avatar
 * Upload a profile image and save its URL on the user document (RegisterData).
 * Field name: 'avatar'
 */
router.post('/users/:id/avatar', authenticateToken, (req, res) => {
  // Enforce that the JWT user matches the path :id to prevent unauthorized avatar changes
  try {
    const pathUserId = req.params.id;
    const tokenUserId = req.user && (req.user.user_id || req.user.userId || req.user.id || req.user.sub);
    if (tokenUserId && String(tokenUserId) !== String(pathUserId)) {
      try { console.warn('[avatar] userId mismatch', { tokenUserId: String(tokenUserId), pathUserId: String(pathUserId) }); } catch {}
      return res.status(403).json({ success: false, message: 'Forbidden: token user does not match requested user' });
    }
  } catch {}

  // Manually invoke multer to catch errors and respond with JSON
  upload.single('avatar')(req, res, async (multerErr) => {
    if (multerErr) {
      const code = multerErr.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      return res.status(code).json({ success: false, message: multerErr.message || 'Upload error' });
    }
    try {
      const userId = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid user ID format' });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded. Use field name "avatar".' });
      }

      // Upload file to S3 and use its public URL
      let s3Result;
      try {
        s3Result = await uploadFile(req.file);
      } catch (e) {
        console.error('S3 upload failed:', e);
        return res.status(500).json({ success: false, message: 'Failed to upload to storage' });
      } finally {
        // best-effort delete local file
        try { if (req.file && req.file.path) await fs.promises.unlink(req.file.path); } catch {}
      }
      const avatarUrl = (s3Result && (s3Result.Location || s3Result.location)) || '';

      // Prefer updating RegisterUser by id; if not found, attempt PostUser then sync by email
      let updated = await RegisterUser.findByIdAndUpdate(
        userId,
        { $set: { avatarUrl } },
        { new: true }
      );

      if (!updated) {
        const postUser = await PostUser.findById(userId);
        if (!postUser) {
          return res.status(404).json({ success: false, message: 'User not found' });
        }
        // Update PostUser's own avatarUrl so fetching by PostUser id returns it on refresh
        await PostUser.findByIdAndUpdate(userId, { $set: { avatarUrl } }, { new: false });
        // Best-effort sync RegisterUser by email
        if (postUser.email) {
          updated = await RegisterUser.findOneAndUpdate(
            { email: postUser.email },
            { $set: { avatarUrl } },
            { new: true }
          );
        }
      } else {
        // Also best-effort sync PostUser by email so other parts of app using PostUser see avatar on refresh
        if (updated.email) {
          await PostUser.findOneAndUpdate(
            { email: updated.email },
            { $set: { avatarUrl } },
            { new: false }
          );
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: {
          avatarUrl,
          userId,
        },
      });
    } catch (err) {
      console.error('Avatar upload failed:', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  });
});

/**
 * GET /users/:id/profile
 * Returns public profile info including avatarUrl
 */
router.get('/users/:id/profile', async (req, res) => {
  try {
    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }

    // Best-effort decode token to assist enrichment when IDs differ between models
    let tokenUser = null;
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (token) {
        const trySecrets = [process.env.JWT_SECRET, 'amitchaudhary100', 'your_jwt_secret'].filter(Boolean);
        for (const secret of trySecrets) {
          try { tokenUser = jwt.verify(token, secret); break; } catch { /* try next */ }
        }
      }
    } catch {}

    let user = await RegisterUser.findById(userId).lean();
    let source = 'register';
    if (!user) {
      const p = await PostUser.findById(userId).lean();
      if (!p) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      // If avatarUrl is missing on PostUser, try to enrich from RegisterUser by multiple strategies
      if (!p.avatarUrl || p.avatarUrl === '') {
        let reg = null;
        // 1) Case-insensitive email match
        if (p.email) {
          try {
            reg = await RegisterUser.findOne({ email: { $regex: new RegExp(`^${p.email}$`, 'i') } }).lean();
          } catch {}
        }
        // 2) Mobile match fallback
        if (!reg && p.mobile) {
          try { reg = await RegisterUser.findOne({ mobile: p.mobile }).lean(); } catch {}
        }
        // 3) Token user id match (if token provided)
        if (!reg && tokenUser) {
          const tId = tokenUser.user_id || tokenUser.userId || tokenUser.id || tokenUser.sub;
          if (tId && mongoose.Types.ObjectId.isValid(String(tId))) {
            try { reg = await RegisterUser.findById(String(tId)).lean(); } catch {}
          }
        }
        if (reg && reg.avatarUrl) {
          p.avatarUrl = reg.avatarUrl;
        }
      }
      user = p;
      source = 'postProperty';
    }

    return res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name || '',
        email: user.email || '',
        mobile: user.mobile || '',
        role: user.role || 'user',
        avatarUrl: user.avatarUrl || '',
        source,
      },
    });
  } catch (err) {
    console.error('Fetch profile failed:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// --- Email verification update endpoint ---
// PATCH /postPerson/users/:id/email-verified
// Updates a user's emailVerified boolean (admin only)
router.patch('/postPerson/users/:id/email-verified', adminVerify, async (req, res) => {
  try {
    const userId = req.params.id;
    let { emailVerified } = req.body || {};

    // Default to true if not explicitly provided
    if (typeof emailVerified === 'undefined') emailVerified = true;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }

    // Validate boolean
    if (typeof emailVerified !== 'boolean') {
      return res.status(400).json({ success: false, message: 'emailVerified must be a boolean' });
    }

    let updatedDoc = null;
    let updatedSource = null;

    // 1) Try RegisterUser by id
    updatedDoc = await RegisterUser.findByIdAndUpdate(
      userId,
      { $set: { emailVerified } },
      { new: true }
    );
    if (updatedDoc) {
      updatedSource = 'register';
      // Best-effort sync PostUser by email
      if (updatedDoc.email) {
        await PostUser.findOneAndUpdate(
          { email: updatedDoc.email },
          { $set: { emailVerified } },
          { new: false }
        );
      }
    }

    // 2) Fallback: PostUser by id
    if (!updatedDoc) {
      updatedDoc = await PostUser.findByIdAndUpdate(
        userId,
        { $set: { emailVerified } },
        { new: true }
      );
      if (updatedDoc) {
        updatedSource = 'postProperty';
        // Best-effort sync RegisterUser by email
        if (updatedDoc.email) {
          await RegisterUser.findOneAndUpdate(
            { email: updatedDoc.email },
            { $set: { emailVerified } },
            { new: false }
          );
        }
      }
    }

    if (!updatedDoc) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Email verification status updated',
      data: {
        id: updatedDoc._id,
        name: updatedDoc.name,
        email: updatedDoc.email,
        mobile: updatedDoc.mobile,
        emailVerified: updatedDoc.emailVerified === true,
        updatedAt: updatedDoc.updatedAt,
        source: updatedSource,
      }
    });
  } catch (err) {
    console.error('Failed to update emailVerified:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Explicit preflight for email-verified endpoint (helps some environments)
router.options('/postPerson/users/:id/email-verified', cors());

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
router.delete('/postPerson/deleteUser/:id', adminVerify, async (req, res) => {
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
router.delete('/postPerson/userDelete/:id', adminVerify, async (req, res) => {
  // Redirect to main deletion endpoint
  req.url = `/postPerson/deleteUser/${req.params.id}`;
  return router.handle(req, res);
});

/**
 * Admin endpoint for user deletion
 */
router.delete('/admin/user/delete/:id', adminVerify, async (req, res) => {
  // Redirect to main deletion endpoint
  req.url = `/postPerson/deleteUser/${req.params.id}`;
  return router.handle(req, res);
});

module.exports = router;

// --- Role update endpoint ---
// PATCH /postPerson/users/:id/role
// Updates a user's role in the RegisterData collection
router.patch('/postPerson/users/:id/role', adminVerify, async (req, res) => {

  try {
    const userId = req.params.id;
    const { role } = req.body || {};

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }

    // Validate role (case-insensitive)
    const allowedRolesLower = new Set(['user', 'blog', 'admin', 'agent', 'owner', 'builder']);
    const roleNormalized = typeof role === 'string' ? role.trim() : '';
    if (!roleNormalized || !allowedRolesLower.has(roleNormalized.toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Invalid role value' });
    }

    let updatedDoc = null;
    let updatedSource = null;

    // 1) Try update in RegisterUser by id
    updatedDoc = await RegisterUser.findByIdAndUpdate(
      userId,
      { $set: { role: roleNormalized } },
      { new: true }
    );
    if (updatedDoc) {
      updatedSource = 'register';
      // Best-effort sync into PostUser by email if exists
      if (updatedDoc.email) {
        await PostUser.findOneAndUpdate(
          { email: updatedDoc.email },
          { $set: { role: roleNormalized } },
          { new: false }
        );
      }
    }

    // 2) If not found in RegisterUser, try update in PostUser by id
    if (!updatedDoc) {
      updatedDoc = await PostUser.findByIdAndUpdate(
        userId,
        { $set: { role: roleNormalized } },
        { new: true }
      );
      if (updatedDoc) {
        updatedSource = 'postProperty';
        // Best-effort sync into RegisterUser by email if exists
        if (updatedDoc.email) {
          await RegisterUser.findOneAndUpdate(
            { email: updatedDoc.email },
            { $set: { role: roleNormalized } },
            { new: false }
          );
        }
      }
    }

    if (!updatedDoc) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Role updated successfully',
      data: {
        id: updatedDoc._id,
        name: updatedDoc.name,
        email: updatedDoc.email,
        mobile: updatedDoc.mobile,
        role: updatedDoc.role,
        updatedAt: updatedDoc.updatedAt,
        source: updatedSource,
      }
    });
  } catch (err) {
    console.error('Failed to update role:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
