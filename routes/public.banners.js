const express = require('express');
const router = express.Router();
const BannerController = require('../Controller/AdminController/BannerController');

// Public route to get active banners (no authentication required)
router.get('/active', BannerController.getActiveBanners);

module.exports = router;

