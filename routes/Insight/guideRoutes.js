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
const { protect, authorize } = require('../../middleware/auth');
const upload = require('../../middleware/upload');

// Public routes
router.get('/', getGuides);
router.get('/featured', getFeaturedGuides);
router.get('/category/:category', getGuidesByCategory);
router.get('/:id', getGuide);

// Protected routes (Admin only)
router.post('/', protect, authorize('admin'), upload.single('file'), createGuide);
router.put('/:id', protect, authorize('admin'), upload.single('file'), updateGuide);
router.delete('/:id', protect, authorize('admin'), deleteGuide);

module.exports = router;
