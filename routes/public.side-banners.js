const express = require('express');
const router = express.Router();
const SideBannerController = require('../Controller/AdminController/SideBannerController');

router.get('/active', SideBannerController.getActiveSideBanners);

module.exports = router;
