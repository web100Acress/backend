const express = require('express');
const router = express.Router();
const ProjectOrderController = require('../Controller/AdminController/ProjectOrderController');
const adminVerify = require('../middleware/adminVerify');

// Get all project orders
router.get('/', adminVerify, ProjectOrderController.getProjectOrders);

// Update project orders
router.post('/', adminVerify, ProjectOrderController.updateProjectOrders);
router.put('/', adminVerify, ProjectOrderController.updateProjectOrders);

// Get project order by category
router.get('/:category', adminVerify, ProjectOrderController.getProjectOrderByCategory);

module.exports = router;


