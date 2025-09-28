const express = require('express');
const router = express.Router();
const EnquiryController = require('../../Controller/Insight/EnquiryController');
const jwtVerification = require('../../middleware/adminVerify');

// Middleware to parse JSON data
router.use(express.json({ limit: '10mb' }));
router.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply admin verification middleware to all admin routes
router.use(jwtVerification);

// ===== ADMIN ENQUIRY ROUTES (authentication required) =====

// GET /enquiries - Get all enquiries (admin only)
router.get('/enquiries', EnquiryController.getAllEnquiries);

// PUT /enquiries/:id - Update enquiry status (admin only)
router.put('/enquiries/:id', EnquiryController.updateEnquiryStatus);

// DELETE /enquiries/:id - Delete enquiry (admin only)
router.delete('/enquiries/:id', EnquiryController.deleteEnquiry);

module.exports = router;
