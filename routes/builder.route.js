const express = require("express");
const router = express.Router();
const BuilderController = require("../Controller/AdminController/FrontController/BuilderController");
const adminVerify = require("../middleware/adminVerify");

// POST /builder/Insert - Create new builder
router.post("/Insert", BuilderController.builderInsert);

// GET /builder/viewAll - Get all builders
router.get("/viewAll", BuilderController.builderViewAll);

// GET /builder/view/:id - Get single builder
router.get("/view/:id", BuilderController.builderView);

// PUT /builder/update/:id - Update builder (admin only)
router.put("/update/:id", adminVerify, BuilderController.builderUpdate);

// DELETE /builder/delete/:id - Delete builder (admin only)
router.delete("/delete/:id", adminVerify, BuilderController.builderDelete);

module.exports = router;
