const express = require('express');
const router = express.Router();
const EnquiryController = require('../../Controller/Insight/EnquiryController');
const jwtVerification = require('../../middleware/adminVerify');

// Middleware to parse JSON data
router.use(express.json({ limit: '10mb' }));
router.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== PUBLIC ENQUIRY ROUTES (no authentication required) =====

// POST /enquiry - Submit new enquiry (public route)
router.post('/enquiry', EnquiryController.enquiry_Insert);

module.exports = router;
