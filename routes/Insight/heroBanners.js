const express = require('express');
const router = express.Router();
const multer = require('multer');
const jwtVerification = require('../../middleware/adminVerify');
const heroBannersController = require('../../Controller/Insight/HeroBannersController');

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

// Apply admin verification middleware to admin routes only
// Public routes don't need authentication

// ===== HERO BANNERS ROUTES (ADMIN) =====

// GET /api/admin/hero-banners - Get all hero banners (admin view)
router.get('/', jwtVerification, heroBannersController.getAllHeroBanners);

// GET /api/admin/hero-banners/active - Get active hero banners (admin view)
router.get('/active', jwtVerification, heroBannersController.getActiveHeroBanners);

// GET /api/admin/hero-banners/:id - Get single hero banner by ID
router.get('/:id', jwtVerification, heroBannersController.getHeroBannerById);

// POST /api/admin/hero-banners/upload - Upload new hero banner
router.post('/upload', jwtVerification, upload.single('bannerImage'), heroBannersController.uploadHeroBanner);

// PUT /api/admin/hero-banners/:id - Update hero banner
router.put('/:id', jwtVerification, upload.single('bannerImage'), heroBannersController.updateHeroBanner);

// PATCH /api/admin/hero-banners/:id/toggle - Toggle hero banner active status
router.patch('/:id/toggle', jwtVerification, heroBannersController.toggleHeroBannerStatus);

// DELETE /api/admin/hero-banners/:id - Delete hero banner
router.delete('/:id', jwtVerification, heroBannersController.deleteHeroBanner);

// ===== PUBLIC HERO BANNERS ROUTES (no authentication required) =====

// GET /api/hero-banners/active - Get active hero banners (public view)
router.get('/active', heroBannersController.getActiveHeroBanners);

// GET /api/hero-banners/:slug - Get hero banners by slug (public view)
router.get('/slug/:slug', heroBannersController.getHeroBannersBySlug);

module.exports = router;
