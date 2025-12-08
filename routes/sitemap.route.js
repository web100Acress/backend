const express = require('express');
const router = express.Router();
const SitemapController = require('../Controller/AdminController/SitemapController');
const adminVerify = require('../middleware/adminVerify');

// Health check endpoint for sitemap
router.get('/health', async (req, res) => {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    // Test the findSitemapPath function
    const sitemapPath = await SitemapController.findSitemapPath();
    const stats = await fs.stat(sitemapPath);
    
    res.json({
      success: true,
      message: 'Sitemap is accessible',
      path: sitemapPath,
      size: stats.size,
      modified: stats.mtime,
      workingDirectory: process.cwd(),
      nodeEnv: process.env.NODE_ENV
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sitemap health check failed',
      error: error.message,
      workingDirectory: process.cwd(),
      nodeEnv: process.env.NODE_ENV
    });
  }
});

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
