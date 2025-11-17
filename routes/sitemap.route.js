const express = require('express');
const router = express.Router();
const SitemapController = require('../Controller/AdminController/SitemapController');
const adminVerify = require('../middleware/adminVerify');

// Get all URLs from sitemap
router.get('/urls', adminVerify, SitemapController.getAllUrls);

// Get single URL by ID
router.get('/urls/:id', adminVerify, SitemapController.getUrlById);

// Add new URL to sitemap
router.post('/urls', adminVerify, SitemapController.addUrl);

// Update existing URL in sitemap
router.put('/urls/:id', adminVerify, SitemapController.updateUrl);

// Delete URL from sitemap
router.delete('/urls/:id', adminVerify, SitemapController.deleteUrl);

module.exports = router;
