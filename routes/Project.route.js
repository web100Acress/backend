const express = require("express");
const projectController = require("../Controller/AdminController/FrontController/ProjectController");
const upload = require("../aws/multerConfig");
const adminVerify = require("../middleware/adminVerify");
const router = express.Router();

router.post(
  "/Insert",
  adminVerify,
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "frontImage", maxCount: 1 },
    { name: "project_locationImage", maxCount: 1 },
    { name: "highlightImage", maxCount: 1 },
    { name: "projectMaster_plan", maxCount: 1 },
    { name: "project_Brochure", maxCount: 1 },
    { name: "project_floorplan_Image", maxCount: 20 },
    { name: "projectGallery", maxCount: 20 },
    { name: "thumbnailImage", maxCount: 1 },
  ]),
  projectController.projectInsert,
);
router.get("/View/:project_url", projectController.projectView);
router.get(
  "/view/homepage/data",
  projectController.projectShowHomepageLazyLoading,
);
router.get("/viewAll/data", projectController.projectviewAll);
router.get("/Edit/:id", projectController.projectEdit);
router.post(
  "/Update/:id",
  adminVerify,
  upload.fields([
    { name: "logo", maxCount: 1 },
      { name: "thumbnailImage", maxCount: 1 },
    { name: "frontImage", maxCount: 1 },
    { name: "project_locationImage", maxCount: 1 },
    { name: "highlightImage", maxCount: 1 },
    { name: "projectMaster_plan", maxCount: 1 },
    { name: "project_Brochure", maxCount: 1 },
    { name: "project_floorplan_Image", maxCount: 20 },
    { name: "projectGallery", maxCount: 20 },

  ]),
  projectController.projectUpdate,
);
router.delete("/Delete/:id", adminVerify, projectController.projectDelete);

router.get("/trending", projectController.project_trending);
router.get("/luxury", projectController.project_luxury);
router.get("/spotlight", projectController.project_spotlight);
router.get("/featured", projectController.project_featured);
router.get("/city", projectController.project_City);
router.get("/upcoming", projectController.project_Upcoming);
router.get("/affordable", projectController.projectAffordable); 
router.get("/scoplots", projectController.projectSCOplots); 
router.get("/commercial", projectController.project_commercial); 
router.get("/budgethomes", projectController.project_budgetHomes); 

module.exports = router;
