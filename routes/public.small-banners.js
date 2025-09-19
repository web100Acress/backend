const express = require('express');
const router = express.Router();
const SmallBannerController = require('../Controller/AdminController/SmallBannerController');

// Public route to get active small banners (no authentication required)
router.get('/active', SmallBannerController.getActiveSmallBanners);

module.exports = router;
