const express = require('express');
const router = express.Router();
const { getMarketReports, createMarketReport, deleteMarketReport } = require('../../Controller/Insight/marketReportController');

// File upload middleware
const multer = require('multer');
const path = require('path');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // Increased to 100MB
    files: 1,
    fields: 20, // Number of non-file fields
    headerPairs: 2000 // Max header pairs
  },
  fileFilter: (req, file, cb) => {
    try {
      console.log('=== File Upload Details ===');
      console.log('File fieldname:', file.fieldname);
      console.log('Original name:', file.originalname);
      console.log('MIME type:', file.mimetype);
      console.log('File size:', file.size, 'bytes');
      
      // More permissive check that also looks at file extension
      const fileExt = path.extname(file.originalname).toLowerCase().substring(1);
      console.log('File extension:', fileExt);
      
      const allowedTypes = [
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/msword',
        'application/vnd.ms-office',
        'application/octet-stream',
        'image/jpeg',
        'image/png',
        'image/jpg'
      ];
      
      const allowedExtensions = ['pdf', 'xls', 'xlsx', 'xlsm', 'csv', 'jpeg', 'jpg', 'png'];
      
      const isAllowedType = allowedTypes.includes(file.mimetype);
      const isAllowedExtension = allowedExtensions.includes(fileExt);
      
      if (isAllowedType || isAllowedExtension) {
        console.log('File accepted');
        cb(null, true);
      } else {
        const error = new Error(`Invalid file type. Only PDF, Excel, and Image files are allowed. Received: ${file.mimetype}, ${fileExt}`);
        console.error('File rejected:', error.message);
        req.fileValidationError = error.message;
        cb(error, false);
      }
    } catch (error) {
      console.error('Error in file filter:', error);
      cb(error, false);
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
