const express = require('express');
const router = express.Router();
const InsightContactController = require('../../Controller/Insight/InsightContactController');
const jwtVerification = require('../../middleware/adminVerify');

// Middleware to parse JSON data
router.use(express.json({ limit: '10mb' }));
router.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply admin verification middleware to all admin routes
router.use(jwtVerification);

// ===== ADMIN CONTACT ROUTES (authentication required) =====

// GET /contacts - Get all contacts (admin only)
router.get('/contacts', InsightContactController.getAllContacts);

// PUT /contacts/:id - Update contact status (admin only)
router.put('/contacts/:id', InsightContactController.updateContactStatus);

// DELETE /contacts/:id - Delete contact (admin only)
router.delete('/contacts/:id', InsightContactController.deleteContact);

module.exports = router;
