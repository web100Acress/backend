const express = require("express");
const projectController = require("../Controller/AdminController/FrontController/ProjectController");
const upload = require("../aws/multerConfig");
const adminVerify = require("../middleware/adminVerify");
const uploadErrorHandler = require("../middleware/uploadErrorHandler");
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
    { name: "project_floorplan_Image", maxCount: 15 },
    { name: "projectGallery", maxCount: 15 },
    { name: "thumbnailImage", maxCount: 1 },
  ]),
  uploadErrorHandler,
  projectController.projectInsert,
);
router.get("/View/:project_url", projectController.projectView);
router.get("/admin/View/:project_url", adminVerify, projectController.projectAdminView);
// router.get(
//   "/view/homepage/data",
//   projectController.projectShowHomepageLazyLoading,
// );
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
    { name: "project_floorplan_Image", maxCount: 15 },
    { name: "projectGallery", maxCount: 15 },
  ]),
  uploadErrorHandler,
  projectController.projectUpdate,
);

router.patch(
  "/toggle-visibility/:id",
  adminVerify,
  projectController.toggleProjectVisibility,
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
router.get("/comingsoon", projectController.project_allupcoming);
router.get("/projectsearch", projectController.projectSearch);
router.get("/category", projectController.getProjectsByCategory);
router.get("/suggested", projectController.project_featured); // Suggested projects (reuse featured logic)

module.exports = router;
