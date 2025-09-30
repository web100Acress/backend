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
    console.log('Uploading file with MIME type:', file.mimetype, 'Original name:', file.originalname);
    
    // More permissive check that also looks at file extension
    const fileExt = file.originalname.split('.').pop().toLowerCase();
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.ms-office',
      'application/octet-stream', // Fallback for some Excel files
      'image/jpeg',
      'image/png',
      'image/jpg'
    ];
    
    const allowedExtensions = ['pdf', 'xls', 'xlsx', 'xlsm', 'csv', 'jpeg', 'jpg', 'png'];
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExt)) {
      cb(null, true);
    } else {
      console.error('Rejected file upload - MIME:', file.mimetype, 'Extension:', fileExt);
      cb(new Error(`Invalid file type (${file.mimetype}). Only PDF, Excel, and Image files are allowed.`), false);
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
