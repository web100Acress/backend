const express = require('express');
const router = express.Router();
const PriceTrendsController = require('../Controller/AdminController/PriceTrendsController');

// Public routes for price trends (no authentication required)
router.get('/active', PriceTrendsController.getAllPriceTrends);
router.get('/area/:area', PriceTrendsController.getPriceTrendsByArea);

module.exports = router;
