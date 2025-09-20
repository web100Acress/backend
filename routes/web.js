const express = require("express");
const router = express.Router();
const upload = require("../aws/multerConfig");
const { resumeUpload } = require("../aws/multerConfig");
const adminVerify = require("../middleware/adminVerify");
const ContentWriterVerify = require("../middleware/ContentWriterVerify");
// Require Controller Front
const homeController = require("../Controller/AdminController/FrontController/HomeController");
const contactController = require("../Controller/AdminController/FrontController/ContactController");
const blogController = require("../Controller/AdminController/FrontController/BlogController");
const agentController = require("../Controller/AdminController/FrontController/AgentController");
const aboutController = require("../Controller/AdminController/FrontController/AboutController");
const projectController = require("../Controller/AdminController/FrontController/ProjectController");
const BuyController = require("../Controller/AdminController/FrontController/BuyController");
const rentController = require("../Controller/AdminController/FrontController/RentController");

// const authAdmin = require('../middleware/registerAuth')
const PostPropertyController = require("../Controller/AdminController/FrontController/PostPropertyController");
const newlaunchController = require("../Controller/AdminController/FrontController/NewlauchController");
const buyCommercial_Model = require("../models/property/buyCommercial");
const authAdmin = require("../middleware/registerAuth");
const CareerController = require("../Controller/AdminController/FrontController/CareerController");
const postPropertyRoute = require("./postProperty.route");
const projectRoute = require("./Project.route");
const propertyRoute = require("./property.route");

const aboutRoute = require("./about.route");
const blogRoute = require("./blog.route");
const projectOrderRoute = require("./projectOrder.route");
const propertyOrderRoute = require("./propertyOrder.route");
const builderRoute = require("./builder.route");
const AuthController = require("../Controller/AdminController/FrontController/Auth.controller");
const RegisterController = require("../Controller/AdminController/FrontController/RegisterController");
const usersRoute = require("./user.route");
const SettingsController = require("../Controller/AdminController/SettingsController");
const bannerRoute = require("./admin.banners");
const smallBannerRoute = require("./admin.small-banners");

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
router.get("/userViewAll",adminVerify, projectController.userViewAll);
router.get("/userViewAll/dowloadData",adminVerify, projectController.enquiryDownload);
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

router.use("/postPerson", postPropertyRoute);

//post enquiry
router.get("/postEnq_view", PostPropertyController.postEnquiry_view);
router.post("/postEnquiry", PostPropertyController.postPropertyEnquiry);
router.delete("/postEnq_delete/:id", PostPropertyController.postEnquiry_delete);

//Blog

router.use("/blog", blogRoute);

//Project Order
router.use("/projectOrder", projectOrderRoute);

// Property Order
router.use("/propertyOrder", propertyOrderRoute);

//Builder
router.use("/builder", builderRoute);

// Mount user admin routes (role update, deletions, etc.)
router.use("/", usersRoute);

//Searching routing
// searching rent and buy
router.get("/property/search/:key", homeController.search);
//searching buy
router.get("/buyproperty/search/:key", homeController.search_buy);
router.get("/data/filter", homeController.filter_data);
router.get("/rentproperty/search/:key", homeController.search_rent);

//career
router.post(
  "/career/page/Insert",
  upload.fields([
    { name: "bannerImage", maxCount: 1 },
    { name: "activityImage", maxCount: 10 },
    { name: "highlightImage", maxCount: 10 },
  ]),
  CareerController.careerInsert,
);
router.get("/career/page/View", CareerController.careerView);
router.get("/career/page/edit/:id", CareerController.careerEdit);
router.post(
  "/career/page/update/:id",
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
router.post("/career/opening/Insert", CareerController.openingInsert);
router.get("/career/opening/ViewAll", CareerController.openingView_all);
router.get("/career/opening/View/:id", CareerController.openingView_id);
router.get("/career/opening/edit/:id", CareerController.openingEdit);
router.put("/career/opening/update/:id", CareerController.openingUpdate);
router.delete("/career/opening/delete/:id", CareerController.openingDelete);

// Applications for job openings
router.post(
  "/career/opening/:id/apply",
  resumeUpload.single("resume"),
  CareerController.applyForOpening,
);
router.get(
  "/career/opening/:id/applications",
  adminVerify,
  CareerController.listApplicationsByOpening,
);
router.put(
  "/career/application/:appId/approve",
  adminVerify,
  CareerController.approveApplication,
);
router.put(
  "/career/application/:appId/reject",
  adminVerify,
  CareerController.rejectApplication,
);

// Career: Applications aggregate counts
router.get(
  "/career/application/count",
  adminVerify,
  CareerController.applicationsCount,
);

router.post("/pahleGhar", newlaunchController.pahleGhar);
router.post("/Valley", newlaunchController.Valley);
router.get("/snapShot", homeController.dataSnapshot);

// try code
router.get("/projectCount", projectController.projectCount_city);
// This routes used for the navigate leads from other domains
router.post("/submit", homeController.leadSumbit);

//This route is for admin access to verify admin whether it is admin or not
router.get("/auth/isAdmin",adminVerify,AuthController.isAdminVerify);
router.get("/auth/isContentWriter",ContentWriterVerify,AuthController.isContentWriterVerify);

// User delete route (admin only)
router.delete("/user/:id", adminVerify, RegisterController.deleteUserAndProperties);

// Site settings: Shorts video ID
router.get("/settings/shorts-video-id", SettingsController.getShortsVideoId);
router.put("/settings/shorts-video-id", adminVerify, SettingsController.updateShortsVideoId);

// Banner management routes
router.use("/api/admin/banners", bannerRoute);
router.use("/api/admin/small-banners", smallBannerRoute);

// Project order management routes
const adminProjectOrderRoute = require("./admin.project-orders");
const publicProjectOrderRoute = require("./public.project-orders");
router.use("/api/admin/project-orders", adminProjectOrderRoute);
router.use("/api/project-orders", publicProjectOrderRoute);

// Public banner routes (no authentication required)
const publicBannerRoute = require("./public.banners");
const publicSmallBannerRoute = require("./public.small-banners");
router.use("/api/banners", publicBannerRoute);
router.use("/api/small-banners", publicSmallBannerRoute);

module.exports = router;