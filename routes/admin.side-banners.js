const express = require('express');
const multer = require('multer');
const router = express.Router();
const adminVerify = require('../middleware/adminVerify');
const SideBannerController = require('../Controller/AdminController/SideBannerController');

// Multer configuration - memory storage for direct S3 upload
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB
  },
  fileFilter
});

// Admin routes
router.get('/', adminVerify, SideBannerController.getAllSideBanners);
router.get('/:id', adminVerify, SideBannerController.getSideBannerById);
router.post('/upload', adminVerify, upload.fields([{ name: 'bannerImage', maxCount: 1 }]), SideBannerController.uploadSideBanner);
router.patch('/:id', adminVerify, upload.fields([{ name: 'bannerImage', maxCount: 1 }]), SideBannerController.updateSideBanner);
router.patch('/:id/toggle', adminVerify, SideBannerController.toggleSideBannerStatus);
router.delete('/:id', adminVerify, SideBannerController.deleteSideBanner);

// Error handling middleware for Multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 20MB.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name. Expected "bannerImage".'
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
