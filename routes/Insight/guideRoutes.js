const express = require('express');
const router = express.Router();
const {
  getGuides,
  getGuide,
  createGuide,
  updateGuide,
  deleteGuide,
  getGuidesByCategory,
  getFeaturedGuides
} = require('../../Controller/Insight/guideController');
const adminVerify = require('../../middleware/adminVerify');
const upload = require('../../aws/multerConfig');

// Public routes
router.get('/', getGuides);
router.get('/featured', getFeaturedGuides);
router.get('/category/:category', getGuidesByCategory);
router.get('/:id', getGuide);

// Protected routes (Admin only)
router.post('/', adminVerify, upload.single('file'), createGuide);
router.put('/:id', adminVerify, upload.single('file'), updateGuide);
router.delete('/:id', adminVerify, deleteGuide);

module.exports = router;
