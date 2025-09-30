const express = require('express');
const router = express.Router();
const { getMarketReports, createMarketReport, deleteMarketReport } = require('../../Controller/Insight/marketReportController');

// File upload middleware
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Excel, and Image files are allowed.'), false);
    }
  }
});

// @route   GET /api/market-reports
// @desc    Get all market reports
// @access  Public
router.get('/', getMarketReports);

// @route   POST /api/market-reports
// @desc    Create a new market report
// @access  Private
router.post(
  '/',
  upload.single('file'),
  createMarketReport
);

// @route   DELETE /api/market-reports/:id
// @desc    Delete a market report
// @access  Public
router.delete('/:id', deleteMarketReport);

module.exports = router;
