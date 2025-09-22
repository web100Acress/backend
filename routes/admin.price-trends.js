const express = require('express');
const router = express.Router();
const PriceTrendsController = require('../Controller/AdminController/PriceTrendsController');
const adminVerify = require('../middleware/adminVerify');

// All routes require admin verification
router.use(adminVerify);

// Price trends routes
router.get('/', PriceTrendsController.getAllPriceTrends);
router.post('/', PriceTrendsController.addPriceTrend);
router.get('/area/:area', PriceTrendsController.getPriceTrendsByArea);
router.put('/:id', PriceTrendsController.updatePriceTrend);
router.delete('/:id', PriceTrendsController.deletePriceTrend);

module.exports = router;
