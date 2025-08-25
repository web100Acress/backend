const express = require("express");
const PropertyOrderController = require("../Controller/AdminController/FrontController/PropertyOrderController");
const adminVerify = require("../middleware/adminVerify");
const router = express.Router();

// Get all property orders (admin only)
router.get("/all", adminVerify, PropertyOrderController.getAllPropertyOrders);

// Get property order by builder name (public)
router.get("/builder/:builderName", PropertyOrderController.getPropertyOrderByBuilder);

// Create or update property order (admin only)
router.post("/save", adminVerify, PropertyOrderController.createOrUpdatePropertyOrder);

// Delete property order (admin only)
router.delete("/builder/:builderName", adminVerify, PropertyOrderController.deletePropertyOrder);

// Get all property orders for sync (public)
router.get("/sync", PropertyOrderController.getAllPropertyOrdersForSync);

module.exports = router;
