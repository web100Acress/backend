const express = require('express');
const router = express.Router();
const multer = require('multer');
const jwtVerification = require('../../middleware/adminVerify');
const insightsController = require('../../Controller/Insight/InsightsController');
const enquiryRoutes = require('./enquiryRoutes');
const adminEnquiryRoutes = require('./adminEnquiryRoutes');

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

// Middleware to parse JSON data from FormData
router.use(express.json({ limit: '10mb' }));
router.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply admin verification middleware to all routes
router.use(jwtVerification);

// ===== CITY ROUTES =====

// GET /api/admin/cities - Get all cities organized by category
router.get('/cities', insightsController.getAllCities);

// GET /api/admin/cities/:category - Get cities by category (ncr, metro, other)
router.get('/cities/category/:category', insightsController.getCitiesByCategory);

// POST /api/admin/cities - Create new city
router.post('/cities', upload.single('bannerImage'), insightsController.createCity);

// PUT /api/admin/cities/:id - Update city
router.put('/cities/:id', upload.single('bannerImage'), insightsController.updateCity);

// DELETE /api/admin/cities/:id - Delete city
router.delete('/cities/:id', insightsController.deleteCity);

// ===== PUBLIC PRICE TRENDS ROUTES (no authentication required) =====

// GET /api/price-trends/city/:city - Get public price trends by city
router.get('/price-trends/city/:city', insightsController.getPriceTrendsByCityPublic);

// POST /api/admin/price-trends - Create new price trend
router.post('/price-trends', insightsController.createPriceTrend);

// PUT /api/admin/price-trends/:id - Update price trend
router.put('/price-trends/:id', insightsController.updatePriceTrend);

// DELETE /api/admin/price-trends/:id - Delete price trend
router.delete('/price-trends/:id', insightsController.deletePriceTrend);

// ===== ENQUIRY ROUTES =====
// Include admin enquiry routes (these require authentication)
router.use('/', adminEnquiryRoutes);

module.exports = router;
