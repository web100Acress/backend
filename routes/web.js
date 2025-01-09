const express = require("express");
const router = express.Router();
const upload=require('../aws/multerConfig')
const fileUpload = require('express-fileupload');
const adminVerify = require("../middleware/adminVerify");
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


// Admin Controller routing
//projectDetail page
router.use("/project",projectRoute);
//page with detail
// router.post("/project/Insert",
//   upload.fields([{name:"logo",maxCount:1},
//     {name:"frontImage",maxCount:1},
//     {name:"project_locationImage",maxCount:1}
//     ,{name:"highlightImage",maxCount:1},
//     {name:"projectMaster_plan",maxCount:1},
//     {name:"project_Brochure",maxCount:1},
//     {name:"project_floorplan_Image",maxCount:20},
//     {name:"projectGallery",maxCount:20},
//   ]), 
//   projectController.projectInsert);
// router.get("/project/View/:project_url", projectController.projectView);
// router.get("/project/viewAll/data", projectController.projectviewAll);
// router.get("/project/Edit/:id", projectController.projectEdit);
// router.post("/project/Update/:id",
//   upload.fields([{name:"logo",maxCount:1},
//     {name:"frontImage",maxCount:1},
//     {name:"project_locationImage",maxCount:1}
//     ,{name:"highlightImage",maxCount:1},
//     {name:"projectMaster_plan",maxCount:1},
//     {name:"project_Brochure",maxCount:1},
//     {name:"project_floorplan_Image",maxCount:20},
//     {name:"projectGallery",maxCount:20},
//   ]),
//   projectController.projectUpdate);
// router.delete("/project/Delete/:id", projectController.projectDelete);

// router.get("/project/trending", projectController.project_trending);
// router.get("/project/featured", projectController.project_featured);
// router.get("/project/city", projectController.project_City);
// router.get("/project/upcoming", projectController.project_Upcoming);
// router.get("/project/affordable", projectController.projectAffordable);
router.delete("/floorImage/:id/:indexNumber",adminVerify,projectController.floorImage)
  
//from
router.post("/userInsert", projectController.userInsert);
router.get("/userViewAll", projectController.userViewAll);
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
router.get("/highlight/edit/:id",projectController.highlightedit)
router.post("/highlight/update/:id",projectController.highlightupdate)
router.delete("/highlight/delete/:id",projectController.highlightdelete)

//contact
// Customer Contact routing handler
router.post("/contact_Insert", contactController.contact_Insert);
// router.post('/contact_Updated/:id', contactController.contact_Update)
router.get("/contact_view/:id/customer", contactController.contact_view);
router.get("/contact/viewAll", contactController.contactviewAll);
router.delete("/contact_delete/:id/delete", contactController.contact_delete);
// contact page detail handler
router.post("/contact_pagedetail", contactController.contact_pagedetail);
router.get(
  "/contact_pagedetail_edit/:id/edit",
  contactController.contact_pagedetail_edit
);
router.post(
  "/contact_pagedetail_update/:id/update",
  contactController.contact_pagedetail_update
);
router.get(
  "/contact_pagedetail_view/:id/view",
  contactController.contact_pagedetail_view
);
router.get(
  "/contact_pagedetail_viewAll",
  contactController.contactpagedetail_viewAll
);
router.delete(
  "/contact_pagedetail_delete/:id/delete",
  contactController.contact_pagedetail_delete
);
//Property
//Buy
router.post("/property/buyInsert",upload.fields([{name:"frontImage",maxCount:1},{name:"otherImage",maxCount:20}]), BuyController.buycommercialInsert);
// router.get('/property/buy/:type', BuyController.buycommercialView)
// router.get('/property/buy/:projectName/:type', BuyController.view_Name_type)
router.get("/property/buy/ViewAll", BuyController.viewAll);
router.get("/property/view/:id", BuyController.buyView_id);
router.get("/property/buy/edit/:id", BuyController.buycommercialEdit);
router.post("/property/buy/update/:id", upload.fields([{name:"frontImage",maxCount:1},{name:"otherImage",maxCount:20}]),BuyController.buycommercialUpdate);
router.delete("/property/buy/delete/:id", BuyController.buycommercialDelete);
//rent
router.post("/property/rentInsert",upload.fields([  { name: "frontImage", maxCount: 1 },   { name: "otherImage", maxCount: 20 }, ]), rentController.rentInsert);
router.get("/property/:id/rentedit", rentController.rentEdit);
router.get("/property/rent/:id", rentController.rentView_id);
router.get("/property/:type/rentView", rentController.rentView);
router.get("/property/viewAll", rentController.rentViewAll);
router.post("/property/:id/rentUpdate",upload.fields([  { name: "frontImage", maxCount: 1 },   { name: "otherImage", maxCount: 20 }, ]), rentController.rentUpdate);
router.delete("/property/:id/rentDelete", rentController.rentDelete);
//About_Page
//Insert
router.post("/about/aboutInsert", aboutController.aboutInsert);
router.get("/about/:id/aboutView", aboutController.aboutView);
router.get("/about/viewAll", aboutController.aboutViewAll);
router.get("/about/:id/aboutEdit", aboutController.aboutEdit);
router.post("/about/:id/aboutUpdate", aboutController.aboutUpdate);
router.delete("/about/:id/aboutDelete", aboutController.aboutDelete);
//testimonial
router.post("/testimonial/testimonialInsert",aboutController.testimonialInsert);
router.get("/testimonial/testimonialView/:id", aboutController.testimonialView);
router.get("/testimonial/viewAll", aboutController.testimonialViewAll);
router.get("/testimonial/testimonialEdit/:id", aboutController.testimonialEdit);
router.post(
  "/testimonial/testimonialUpdate/:id",
  aboutController.testimonialUpdate
);
router.delete(
  "/testimonial/testimonialDelete/:id",
  aboutController.testimonialDelete
);
//Register

// Post Property

//post person

router.use("/postPerson",postPropertyRoute);

//post enquiry
router.get("/postEnq_view",PostPropertyController.postEnquiry_view)
router.post("/postEnquiry", PostPropertyController.postPropertyEnquiry);

//Blog
router.post("/blog/insert",upload.single('blog_Image'), blogController.blog_insert);
router.get("/blog/view", blogController.blog_view);
router.get("/blog/view/:id", blogController.blog_viewId);
router.get("/blog/edit/:id", blogController.blog_edit);
router.put("/blog/update/:id",upload.single('blog_Image'), blogController.blog_update);
router.delete("/blog/delete/:id", blogController.blog_delete);

//Searching routing
// searching rent and buy
router.get("/property/search/:key", homeController.search);
//searching buy
router.get("/buyproperty/search/:key", homeController.search_buy);
router.get("/data/filter",homeController.filter_data)
router.get('/rentproperty/search/:key',homeController.search_rent)

//new launch

//career
router.post("/career/page/Insert",
  upload.fields([
    { name: "bannerImage", maxCount: 1 }, 
    { name: "activityImage", maxCount: 10 }, 
    { name: "highlightImage", maxCount: 10 }
  ]),
  CareerController.careerInsert)
router.get("/career/page/View",CareerController.careerView)
router.get("/career/page/edit/:id",CareerController.careerEdit)
router.post("/career/page/update/:id",
  upload.fields([
    { name: "bannerImage", maxCount: 1 }, 
    { name: "activityImage", maxCount: 10 }, 
    { name: "highlightImage", maxCount: 10 }
  ]),
  CareerController.careerUpdate)
router.delete('/career/opening/delete/:id',CareerController.openingDelete)
// router.post("/mail",rentController.email)

//Job Opening
router.post("/career/opening/Insert", CareerController.openingInsert)
router.get("/career/opening/ViewAll", CareerController.openingView_all)
router.get("/career/opening/View/:id", CareerController.openingView_id)
router.get("/career/opening/edit/:id",CareerController.openingEdit)
router.put('/career/opening/update/:id',CareerController.openingUpdate)
router.delete('/career/opening/delete/:id',CareerController.openingDelete)




router.post('/pahleGhar',newlaunchController.pahleGhar)
router.post('/Valley',newlaunchController.Valley)
router.get("/snapShot",homeController.dataSnapshot)

// try code 
router.get("/projectCount",projectController.projectCount_city)
// This routes used for the navigate leads from other domains 
router.post('/submit',homeController.leadSumbit)
module.exports = router;
