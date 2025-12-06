const express = require('express');
const router = express.Router();
const ProjectOrderController = require('../Controller/AdminController/ProjectOrderController');

// Get all project orders (public)
router.get('/', ProjectOrderController.getProjectOrders);

// Update project orders (public - for admin panel)
router.put('/', ProjectOrderController.updateProjectOrders);

// Get project order by category (public)
router.get('/:category', ProjectOrderController.getProjectOrderByCategory);

module.exports = router;


