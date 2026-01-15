const express = require("express");
const router = express.Router();
const upload = require("../aws/multerConfig");
const { resumeUpload } = require("../aws/multerConfig");
const adminVerify = require("../middleware/adminVerify");
const { hrAdminVerify, adminSalesHeadVerify } = require("../middleware/adminVerify");
const ContentWriterVerify = require("../middleware/ContentWriterVerify");
// Import S3 Routes
const s3Routes = require("./s3Routes");
// Require Controller Front
const homeController = require("../Controller/AdminController/FrontController/HomeController");
const contactController = require("../Controller/AdminController/FrontController/ContactController");
const blogController = require("../Controller/AdminController/FrontController/BlogController");
const agentController = require("../Controller/AdminController/FrontController/AgentController");
const aboutController = require("../Controller/AdminController/FrontController/AboutController");
const projectController = require("../Controller/AdminController/FrontController/ProjectController");
const BuyController = require("../Controller/AdminController/FrontController/BuyController");
const rentController = require("../Controller/AdminController/FrontController/RentController");
const PostPropertyController = require("../Controller/AdminController/FrontController/PostPropertyController");
const newlaunchController = require("../Controller/AdminController/FrontController/NewlauchController");
const buyCommercial_Model = require("../models/property/buyCommercial");
const authAdmin = require("../middleware/registerAuth");
const CareerController = require("../Controller/AdminController/FrontController/CareerController");
const ProjectOrderController = require("../Controller/AdminController/FrontController/ProjectOrderController");
const postPropertyRoute = require("./postProperty.route");
const projectRoute = require("./Project.route");
const propertyRoute = require("./property.route");
const aboutRoute = require("./about.route");
const blogRoute = require("./blog.route");
const projectOrderRoute = require("./projectOrder.route");
const propertyOrderRoute = require("./propertyOrder.route");
const builderRoute = require("./builder.route");
const sideBannerRoute = require("./admin.side-banners");
const publicSideBannerRoute = require("./public.side-banners");

// Mount property order routes
router.use("/propertyOrder", propertyOrderRoute);
const AuthController = require("../Controller/AdminController/FrontController/Auth.controller");
const RegisterController = require("../Controller/AdminController/FrontController/RegisterController");
const usersRoute = require("./user.route");
const SettingsController = require("../Controller/AdminController/SettingsController");
const bannerRoute = require("./admin.banners");
const smallBannerRoute = require("./admin.small-banners");
const sitemapRoute = require("./sitemap.route");

//Router for front home page  controller
// router.get('/', homeController.home)
// router for about page
router.get("/about", aboutController.about);

// router for front contact page
router.get("/contact", contactController.contact);

// router for blog page
// router.get('/blog',blogController.blog)
//router for agent page
router.get("/agent", agentController.agent);

// Mount project routes
router.use("/project", projectRoute);

// Admin Controller routing
// Page with detail

router.delete(
  "/floorImage/:id/:indexNumber",
  adminVerify,
  projectController.floorImage,
);

router.delete(
  "/galleryImage/:id/:indexNumber",
  adminVerify,
  projectController.galleryImage,
);

//from
router.post("/userInsert", projectController.userInsert);
router.get("/userViewAll", adminSalesHeadVerify, projectController.userViewAll);
router.get("/userViewAll/dowloadData", adminSalesHeadVerify, projectController.enquiryDownload);
router.get("/userviewDetail/:id", projectController.userViewDetail);
router.post("/userUpdate/:id", projectController.userUpdate);
router.delete("/userdataDelete/delete/:id", projectController.userdataDelete);
// bhk detail routing
router.post("/bhk_insert/:id", projectController.bhk_insert);
router.get("/bhk_view/:id", projectController.bhk_view);
router.get("/bhk_edit/:id", projectController.bhk_edit);
router.post("/bhk_update/:id", projectController.bhk_update);
router.delete("/bhk_delete/:id", projectController.bhk_delete);
///project highlight
router.post("/highlight/:id", projectController.highlightPoint);
router.get("/highlight/view/:id", projectController.highlightPoint_view);
router.get("/highlight/edit/:id", projectController.highlightedit);
router.post("/highlight/update/:id", projectController.highlightupdate);
router.delete("/highlight/delete/:id", projectController.highlightdelete);

//contact
// Customer Contact routing handler
router.post("/contact_Insert", contactController.contact_Insert);
// router.post('/contact_Updated/:id', contactController.contact_Update)
router.get("/contact_view/:id/customer", contactController.contact_view);
router.get("/contact/viewAll", contactController.contactviewAll);
router.delete("/contact_delete/:id/delete", contactController.contact_delete);
// Contact count for admin dashboard
router.get("/api/admin/contact/count", adminVerify, contactController.contactCount);
// contact page detail handler
router.post("/contact_pagedetail", contactController.contact_pagedetail);
router.get(
  "/contact_pagedetail_edit/:id/edit",
  contactController.contact_pagedetail_edit,
);
router.post(
  "/contact_pagedetail_update/:id/update",
  contactController.contact_pagedetail_update,
);
router.get(
  "/contact_pagedetail_view/:id/view",
  contactController.contact_pagedetail_view,
);
router.get(
  "/contact_pagedetail_viewAll",
  contactController.contactpagedetail_viewAll,
);
router.delete(
  "/contact_pagedetail_delete/:id/delete",
  contactController.contact_pagedetail_delete,
);
//Property
//Buy
router.use("/property", propertyRoute);

//About_Page
//Insert

router.use("/about", aboutRoute);

//testimonial

router.post(
  "/testimonial/testimonialInsert",
  aboutController.testimonialInsert,
);
router.get("/testimonial/testimonialView/:id", aboutController.testimonialView);
router.get("/testimonial/viewAll", aboutController.testimonialViewAll);
router.get("/testimonial/testimonialEdit/:id", aboutController.testimonialEdit);
router.post(
  "/testimonial/testimonialUpdate/:id",
  aboutController.testimonialUpdate,
);
router.delete(
  "/testimonial/testimonialDelete/:id",
  aboutController.testimonialDelete,
);
//Register

// Post Property

//post person

router.use("/postPerson", usersRoute);
router.use("/postPerson", postPropertyRoute);

//post enquiry
router.get("/postEnq_view", PostPropertyController.postEnquiry_view);
router.post("/postEnquiry", PostPropertyController.postPropertyEnquiry);
router.delete("/postEnq_delete/:id", PostPropertyController.postEnquiry_delete);

// USER FOLLOW-UP ROUTES
router.post("/postPerson/followups/:userId", PostPropertyController.addUserFollowup);
router.get("/postPerson/followups/:userId", PostPropertyController.getUserFollowups);
router.put("/postPerson/followups/:followupId", PostPropertyController.updateUserFollowup);
router.delete("/postPerson/followups/:followupId", PostPropertyController.deleteUserFollowup);

//Blog
router.use("/blog", blogRoute);

//Project Order
router.use("/projectOrder", projectOrderRoute);

// API Project Orders (for frontend compatibility)
router.get("/api/project-orders", ProjectOrderController.getAllProjectOrdersForSync);

// Property Order
// searching rent and buy
router.get("/property/search/:key", homeController.search);
//searching buy
// router.get("/buyproperty/search/:key", homeController.search_buy);
//searching rent
// router.get("/rentproperty/search/:key", homeController.search_rent);
// Search suggestions for autocomplete
router.get("/search/suggestions/:query", homeController.searchSuggestions);
router.get("/data/filter", homeController.filter_data);

//Builder
router.use("/builder", builderRoute);

// Test endpoint for API connectivity checks
router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
});

//career
router.post(
  "/career/page/Insert",
  upload.fields([
    { name: "bannerImage", maxCount: 1 },
    { name: "activityImage", maxCount: 10 },
    { name: "highlightImage", maxCount: 10 },
  ]),
  CareerController.careerUpdate,
);
router.delete("/career/opening/delete/:id", CareerController.openingDelete);
// router.post("/mail",rentController.email)

//Job Opening
router.post(
  "/career/opening/Insert",
  upload.single('jdFile'),
  CareerController.openingInsert
);

// remove all just chnage s code
router.get("/career/opening/ViewAll", CareerController.openingView_all);
router.get("/career/opening/View/:id", CareerController.openingView_id);
router.get("/career/opening/:id", CareerController.openingView_id); // Alias for View/:id
router.get("/career/opening/edit/:id", CareerController.openingEdit);
router.put(
  "/career/opening/update/:id",
  upload.single('jdFile'),
  CareerController.openingUpdate
);

// Update job opening status (open/closed)
router.patch(
  "/career/opening/:id",
  hrAdminVerify,
  CareerController.openingUpdateStatus,
);

router.delete("/career/opening/delete/:id", CareerController.openingDelete);

// Applications for job openings
router.post(
  "/career/opening/:id/apply",
  resumeUpload.single("resume"),
  CareerController.applyForOpening,
);

router.get(
  "/career/opening/:id/applications",
  hrAdminVerify,
  CareerController.listApplicationsByOpening,
);
router.put(
  "/career/application/:appId/approve",
  hrAdminVerify,
  CareerController.approveApplication,
);
router.put(
  "/career/application/:appId/reject",
  hrAdminVerify,
  CareerController.rejectApplication,
);

// AI Scoring for applications
router.post(
  "/career/opening/:id/score-applications",
  hrAdminVerify,
  CareerController.scoreApplications,
);

// Follow-up endpoints (must come before /career/application/count)
router.post(
  "/career/application/:applicationId/followup",
  hrAdminVerify,
  CareerController.addFollowup,
);

router.get(
  "/career/application/:applicationId/followup",
  hrAdminVerify,
  CareerController.getFollowups,
);

router.get(
  "/career/followup/:followupId",
  hrAdminVerify,
  CareerController.getFollowupById,
);

router.delete(
  "/career/followup/:followupId",
  hrAdminVerify,
  CareerController.deleteFollowup,
);

// Career: Applications aggregate counts (must come after specific routes)
router.get(
  "/career/application/count",
  hrAdminVerify,
  CareerController.applicationsCount,
);

// Career: Document Upload Routes
router.post("/career/generate-upload-link", CareerController.generateUploadLink);
router.get("/career/verify-upload-token/:token", CareerController.verifyUploadToken);
// Add multer middleware for file uploads
const multer = require('multer');
const uploadDocumentsMulter = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});
router.post("/career/upload-documents/:token",
  uploadDocumentsMulter.fields([
    { name: 'panFile', maxCount: 1 },
    { name: 'aadhaarFile', maxCount: 1 },
    { name: 'photoFile', maxCount: 1 },
    { name: 'marksheetFile', maxCount: 1 },
    { name: 'otherFile1', maxCount: 1 },
    { name: 'otherFile2', maxCount: 1 }
  ]),
  CareerController.uploadDocuments
);
router.get("/career/test-token", CareerController.testToken);

router.post("/pahleGhar", newlaunchController.pahleGhar);
router.post("/Valley", newlaunchController.Valley);
router.get("/snapShot", homeController.dataSnapshot);

// try code
router.get("/projectCount", projectController.projectCount_city);
// This routes used for the navigate leads from other domains
router.post("/submit", homeController.leadSumbit);

//This route is for HR access to verify HR whether it is HR or not
router.get("/auth/isHr", AuthController.isHrVerify);

//This route is for Admin access to verify Admin whether it is Admin or not
router.get("/auth/isAdmin", AuthController.isAdminVerify);

// User delete route (admin only)
router.delete("/user/:id", adminVerify, RegisterController.deleteUserAndProperties);

// Site settings: Shorts video ID
router.get("/settings/shorts-video-id", SettingsController.getShortsVideoId);
router.put("/settings/shorts-video-id", adminVerify, SettingsController.updateShortsVideoId);

// Banner management routes
router.use("/api/admin/banners", bannerRoute);
router.use("/api/admin/small-banners", smallBannerRoute);
router.use("/api/admin/side-banners", sideBannerRoute);

// Public small banners routes (no authentication required)
const publicSmallBannerRoute = require("./public.small-banners");
router.use("/api/small-banners", publicSmallBannerRoute);

// Market Reports routes (admin access)
const marketReportRoutes = require("./Insight/marketReportRoutes");
router.use("/api/market-reports", marketReportRoutes);

// Public banners routes (no authentication required)
const publicBannerRoute = require("./public.banners");
router.use("/api/banners", publicBannerRoute);

// Public side banners routes (no authentication required)
router.use("/api/side-banners", publicSideBannerRoute);

// Insights management routes (for city and price trends)
const insightsRoute = require("./Insight/insights");
router.use("/api/admin", insightsRoute);

// Project order management routes
const adminProjectOrderRoute = require("./admin.project-orders");
const publicProjectOrderRoute = require("./public.project-orders");
router.use("/api/admin/project-orders", adminProjectOrderRoute);
router.use("/api/project-orders", publicProjectOrderRoute);

// Public enquiry routes (no authentication required)
const publicEnquiryRoute = require("./Insight/enquiryRoutes");
router.use("/api", publicEnquiryRoute);

// Public contact routes (no authentication required)
const publicContactRoute = require("./Insight/contactRoutes");
router.use("/api", publicContactRoute);

// Market report routes (public access - no authentication required)
const publicMarketReportRoutes = require("./Insight/marketReportRoutes");
router.use("/api", publicMarketReportRoutes);

// HR Module routes (scaffold)
const hrRoutes = require('./hr.routes');
router.use('/api/hr', hrAdminVerify, hrRoutes);

// Public Onboarding Upload routes
const publicOnboardingRoutes = require('./hr.public.onboarding');
// Internal generate-link should be HR protected
router.use('/api/hr-onboarding', hrAdminVerify, publicOnboardingRoutes);
// Public endpoints (validate/upload) will be accessible without auth under /api/public/onboarding
router.use('/api/public/onboarding', publicOnboardingRoutes);

// Guide routes (public access for viewing, admin for modifications)
const guideRoutes = require("./Insight/guideRoutes");
router.use("/api/guides", guideRoutes);

// Sitemap management routes
router.use("/api/sitemap", sitemapRoute);

// S3 Manager routes
router.use("/api/s3", s3Routes);

// Contact Card routes
const contactCardRoute = require("./contactCard.route");
router.use("/api/contact-cards", contactCardRoute);

// Image proxy routes for S3 CORS issues
const imageProxyRoute = require("./image-proxy.route");
router.use("/api", imageProxyRoute);

module.exports = router;