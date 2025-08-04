const express = require("express");
const ProjectOrderController = require("../Controller/AdminController/FrontController/ProjectOrderController");
const adminVerify = require("../middleware/adminVerify");
const router = express.Router();

// Get all project orders (admin only)
router.get("/all", adminVerify, ProjectOrderController.getAllProjectOrders);

// Get project order by builder name (public)
router.get("/builder/:builderName", ProjectOrderController.getProjectOrderByBuilder);

// Create or update project order (admin only)
router.post("/save", adminVerify, ProjectOrderController.createOrUpdateProjectOrder);

// Delete project order (admin only)
router.delete("/builder/:builderName", adminVerify, ProjectOrderController.deleteProjectOrder);

// Get all project orders for sync (public - used by frontend)
router.get("/sync", ProjectOrderController.getAllProjectOrdersForSync);

module.exports = router; 