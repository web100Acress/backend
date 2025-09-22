const express = require('express');
const router = express.Router();
const multer = require('multer');
const jwtVerification = require('../middleware/adminVerify');
const BannerController = require('../Controller/AdminController/BannerController');

// Configure multer for file uploads - use memory storage for direct S3 upload
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Accept only image files
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

// Error handling middleware for multer
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

// Apply admin verification middleware to all routes
router.use(jwtVerification);

// GET /api/admin/banners - Get all banners (admin view)
router.get('/', BannerController.getAllBanners);

// GET /api/admin/banners/active - Get active banners (public view)
router.get('/active', BannerController.getActiveBanners);

// GET /api/admin/banners/:id - Get single banner by ID
router.get('/:id', BannerController.getBannerById);

// POST /api/admin/banners/upload - Upload new banner
router.post('/upload', upload.single('bannerImage'), BannerController.uploadBanner);

// PATCH /api/admin/banners/:id - Update banner
router.patch('/:id', upload.single('bannerImage'), BannerController.updateBanner);

// PATCH /api/admin/banners/:id/toggle - Toggle banner active status
router.patch('/:id/toggle', BannerController.toggleBannerStatus);

// DELETE /api/admin/banners/:id - Delete banner
router.delete('/:id', BannerController.deleteBanner);

module.exports = router;

