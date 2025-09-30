const MarketReport = require('../../models/insight/MarketReport');
const { uploadFile, deleteFile } = require('../../Utilities/s3HelperUtility');
const { validationResult } = require('express-validator');
const path = require('path');

// Helper function to generate unique filename
const generateUniqueFilename = (originalname) => {
  const ext = path.extname(originalname);
  return `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
};

// @desc    Get all market reports
// @route   GET /api/market-reports
// @access  Private
const getMarketReports = async (req, res) => {
  try {
    const reports = await MarketReport.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email');

    res.json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// @desc    Create a market report
// @route   POST /api/market-reports
// @access  Private
const createMarketReport = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, city, period, type, description } = req.body;
    if (!req.files || !req.files.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    const file = req.file; // Using req.file from multer
    const fileType = file.mimetype;
    const fileSize = file.size;
    const fileName = generateUniqueFilename(file.originalname);

    // Upload file to S3
    const uploadResult = await uploadFile({
      ...file,
      originalname: `market-reports/${fileName}`
    });

    const report = new MarketReport({
      title,
      city,
      period,
      type,
      description,
      fileUrl: uploadResult.Location,
      fileName: file.name,
      fileType,
      fileSize,
      createdBy: req.user.id
    });

    await report.save();

    res.status(201).json({
      success: true,
      data: report
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// @desc    Delete a market report
// @route   DELETE /api/market-reports/:id
// @access  Private
const deleteMarketReport = async (req, res) => {
  try {
    const report = await MarketReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Delete file from S3
    try {
      const key = new URL(report.fileUrl).pathname.substring(1); // Remove leading '/'
      await deleteFile(key);
    } catch (s3Error) {
      console.error('Error deleting file from S3:', s3Error);
      // Continue with report deletion even if S3 deletion fails
    }

    await report.remove();

    res.json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

module.exports = {
  getMarketReports,
  createMarketReport,
  deleteMarketReport
};
