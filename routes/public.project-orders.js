const express = require('express');
const router = express.Router();
const ProjectOrderController = require('../Controller/AdminController/ProjectOrderController');

// Get all project orders (public)
router.get('/', ProjectOrderController.getProjectOrders);

// Get project order by category (public)
router.get('/:category', ProjectOrderController.getProjectOrderByCategory);

module.exports = router;


