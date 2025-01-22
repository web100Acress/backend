const express = require("express");
const router = express.Router();
const aboutController = require("../Controller/AdminController/FrontController/AboutController");

router.post("/aboutInsert", aboutController.aboutInsert);
router.get("/:id/aboutView", aboutController.aboutView);
router.get("/viewAll", aboutController.aboutViewAll);
router.get("/:id/aboutEdit", aboutController.aboutEdit);
router.post("/:id/aboutUpdate", aboutController.aboutUpdate);
router.delete("/:id/aboutDelete", aboutController.aboutDelete);

module.exports = router;
