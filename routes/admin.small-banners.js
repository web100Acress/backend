const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const SmallBannerController = require('../Controller/AdminController/SmallBannerController');
const adminVerify = require('../middleware/adminVerify');

// No need for local directory since we're using memory storage for direct S3 upload

// Multer configuration for small banner uploads - use memory storage for direct S3 upload
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Routes
router.get('/', adminVerify, SmallBannerController.getAllSmallBanners);
router.get('/active', SmallBannerController.getActiveSmallBanners);
router.post('/upload', adminVerify, upload.fields([
  { name: 'desktopBannerImage', maxCount: 1 },
  { name: 'mobileBannerImage', maxCount: 1 }
]), SmallBannerController.uploadSmallBanner);
router.put('/:id', adminVerify, upload.fields([
  { name: 'desktopBannerImage', maxCount: 1 },
  { name: 'mobileBannerImage', maxCount: 1 }
]), SmallBannerController.updateSmallBanner);
router.delete('/:id', adminVerify, SmallBannerController.deleteSmallBanner);
router.patch('/:id/toggle', adminVerify, SmallBannerController.toggleSmallBannerStatus);

// Error handling middleware for Multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name. Expected "desktopBannerImage" or "mobileBannerImage".'
      });
    }
  }
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({
      success: false,
      message: 'Only image files are allowed.'
    });
  }
  next(error);
});

module.exports = router;