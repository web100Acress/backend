const express = require('express');
const router = express.Router();
const InsightContactController = require('../../Controller/Insight/InsightContactController');

// Middleware to parse JSON data
router.use(express.json({ limit: '10mb' }));
router.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== PUBLIC CONTACT ROUTES (no authentication required) =====

// POST /contact - Submit contact form (public route)
router.post('/contact', InsightContactController.contact_Insert);

module.exports = router;
