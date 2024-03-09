const express = require('express')
const router = express.Router()


// Require Controller Front
const homeController = require('../Controller/AdminController/FrontController/HomeController')
const contactController = require('../Controller/AdminController/FrontController/ContactController')
const blogController = require('../Controller/AdminController/FrontController/BlogController')
const agentController = require('../Controller/AdminController/FrontController/AgentController')
const aboutController = require('../Controller/AdminController/FrontController/AboutController')
const projectController = require('../Controller/AdminController/FrontController/ProjectController')
const BuyController = require('../Controller/AdminController/FrontController/BuyController')
const rentController = require('../Controller/AdminController/FrontController/RentController')

// const authAdmin = require('../middleware/registerAuth')
const PostPropertyController = require('../Controller/AdminController/FrontController/PostPropertyController')
const newlaunchController = require('../Controller/AdminController/FrontController/NewlauchController')
const otherpropertyController = require('../Controller/AdminController/FrontController/OtherpropertyController')
const buyCommercial_Model = require('../models/property/buyCommercial')
const authAdmin = require('../middleware/registerAuth')


//Router for front home page  controller
// router.get('/', homeController.home)
// router for about page 
router.get('/about', aboutController.about)

// router for front contact page
router.get('/contact', contactController.contact)

// router for blog page 
// router.get('/blog',blogController.blog)
//router for agent page 
router.get('/agent', agentController.agent)
// project
router.get('/project', projectController.project)

// Admin Controller routing
//projectDetail page 
     //page with detail 
router.post('/projectInsert', projectController.projectInsert)
router.get('/projectView/:project_url', projectController.projectView)
router.get('/project/viewAll', projectController.projectviewAll)
router.get('/project/Edit/:id', projectController.projectEdit)
router.post('/project/Update/:id', projectController.projectUpdate)
router.delete('/project/Delete/:id', projectController.projectDelete)

router.get('/project/trending',projectController.project_trending)
router.get('/project/featured',projectController.project_featured)
router.get('/project/city',projectController.project_City)
router.get('/project/upcoming',projectController.project_Upcoming)
router.get('/project/affordable',projectController.projectAffordable)

   //from
router.post('/userInsert', projectController.userInsert)
router.get("/userViewAll",projectController.userViewAll)
router.get("/userviewDetail/:id",projectController.userViewDetail)
router.post("/userUpdate/:id",projectController.userUpdate)
router.delete("/userdataDelete/delete/:id", projectController.userdataDelete)
    // bhk detail routing 
router.post('/bhk_insert/:id',projectController.bhk_insert)
router.get('/bhk_view/:id',projectController.bhk_view)
router.get('/bhk_edit/:id',projectController.bhk_edit)
router.post('/bhk_update/:id',projectController.bhk_update)
router.delete('/bhk_delete/:id',projectController.bhk_delete)
      ///project highlight
      router.post('/highlight/:id',projectController.highlightPoint)
      router.get("/highlight/view/:id",projectController.highlightPoint_view)

//contact
// Customer Contact routing handler
router.post('/contact_Insert', contactController.contact_Insert)
// router.post('/contact_Updated/:id', contactController.contact_Update)
router.get('/contact_view/:id/customer', contactController.contact_view)
router.get("/contact/viewAll", contactController.contactviewAll)
router.delete('/contact_delete/:id/delete', contactController.contact_delete)
// contact page detail handler
router.post('/contact_pagedetail', contactController.contact_pagedetail)
router.get('/contact_pagedetail_edit/:id/edit', contactController.contact_pagedetail_edit)
router.post('/contact_pagedetail_update/:id/update', contactController.contact_pagedetail_update)
router.get('/contact_pagedetail_view/:id/view', contactController.contact_pagedetail_view)
router.get('/contact_pagedetail_viewAll', contactController.contactpagedetail_viewAll)
router.delete('/contact_pagedetail_delete/:id/delete', contactController.contact_pagedetail_delete)
//Property
//Buy
router.post('/property/buyInsert', BuyController.buycommercialInsert)
// router.get('/property/buy/:type', BuyController.buycommercialView)
// router.get('/property/buy/:projectName/:type', BuyController.view_Name_type)
router.get("/property/buy/ViewAll", BuyController.viewAll)
router.get('/property/view/:id',BuyController.buyView_id)
router.get('/property/buy/edit/:id', BuyController.buycommercialEdit)
router.post('/property/buy/update/:id', BuyController.buycommercialUpdate)
router.delete('/property/buy/delete/:id', BuyController.buycommercialDelete)
//rent
router.post('/property/rentInsert', rentController.rentInsert)
router.get('/property/:id/rentedit', rentController.rentEdit)
router.get('/property/rent/:id',rentController.rentView_id)
router.get('/property/:type/rentView', rentController.rentView)
router.get("/property/viewAll", rentController.rentViewAll)
router.post("/property/:id/rentUpdate", rentController.rentUpdate)
router.delete('/property/:id/rentDelete', rentController.rentDelete)
//About_Page
//Insert
router.post('/about/aboutInsert', aboutController.aboutInsert)
router.get('/about/:id/aboutView', aboutController.aboutView)
router.get("/about/viewAll", aboutController.aboutViewAll)
router.get('/about/:id/aboutEdit', aboutController.aboutEdit)
router.post('/about/:id/aboutUpdate', aboutController.aboutUpdate)
router.delete('/about/:id/aboutDelete', aboutController.aboutDelete)
//testimonial
router.post('/testimonial/testimonialInsert', aboutController.testimonialInsert)
router.get('/testimonial/testimonialView/:id', aboutController.testimonialView)
router.get("/testimonial/viewAll", aboutController.testimonialViewAll)
router.get('/testimonial/testimonialEdit/:id', aboutController.testimonialEdit)
router.post('/testimonial/testimonialUpdate/:id', aboutController.testimonialUpdate)
router.delete('/testimonial/testimonialDelete/:id', aboutController.testimonialDelete)
//Register


// Post Property
 
//post person 

router.post('/postPerson/register', PostPropertyController.postPerson_Register)
router.get('/postPerson/Role/:email',PostPropertyController.postPerson_verifyRole)
router.post('/postPerson/verify_Login',authAdmin, PostPropertyController.postPerson_VerifyLogin)
router.get('/postPerson/logout', PostPropertyController.postPerson_logout)
router.post('/postPerson/postProperty_forget', PostPropertyController.postPerson_forget)
router.post('/postPerson/reset/:token', PostPropertyController.postPerson_reset)
router.get("/postPerson/view", PostPropertyController.postPerson_View)
router.get('/postPerson/edit/:id', PostPropertyController.postPerson_Edit)
router.post("/postPerson/update/:id", PostPropertyController.postPerson_update)
router.delete("/postPerson/delete/:id", PostPropertyController.postPerson_accountDelete)
router.post('/changePassword',PostPropertyController.Post_changePassword)


//property routing
router.post('/postPerson/propertyInsert/:id', PostPropertyController.postProperty)
router.get('/postPerson/propertyView/:id', PostPropertyController.postProperty_View)
router.get('/postPerson/propertyoneView/:id', PostPropertyController.postPropertyOne_View)
router.get('/postPerson/propertyoneEdit/:id', PostPropertyController.postProperty_Edit)
router.post('/postPerson/propertyoneUpdate/:id', PostPropertyController.postProperty_Update)
router.delete('/postPerson/propertyDelete/:id', PostPropertyController.postProperty_Delete)
router.post("/postEnquiry",PostPropertyController.postPropertyEnquiry)


//Blog
router.post("/blog/insert",blogController.blog_insert)
router.get("/blog/view",blogController.blog_view)
router.get("/blog/view/:id",blogController.blog_viewId)
router.get("/blog/edit/:id",blogController.blog_edit)
router.put("/blog/update/:id",blogController.blog_update)
router.delete("/blog/delete/:id",blogController.blog_delete)
    

//Searching routing
// searching rent and buy
router.get("/property/search/:key", homeController.search)
//searching otherproperty
router.post("/postPerson/search", homeController.search_other)
//searching rent
router.get("/rentproperty/search",homeController.search_rent)
//searching buy
router.get("/buyproperty/search",homeController.search_buy)

//new launch 
// router.post("/newlaunch/insert", newlaunchController.newlaunch_Insert)
// router.get("/newlaunch/view/:id", newlaunchController.newlaunch_view)
// router.get("/newlaunch/viewAll", newlaunchController.newlaunch_viewAll)
// router.get("/newlaunch/edit/:id", newlaunchController.newlaunch_edit)
// router.post("/newlaunch/update/:id", newlaunchController.newlaunch_update)
// router.delete("/newlaunch/delete/:id", newlaunchController.newlaunch_delete)
//other Propertyc

router.post("/otherproperty/insert", otherpropertyController.otherproperty_Insert)
router.get("/otherproperty/viewAll", otherpropertyController.otherproperty_viewAll)
router.get('/otherproperty/view/:id', otherpropertyController.otherproperty_view)
router.get("/otherproperty/edit/:id", otherpropertyController.otherproperty_edit)
router.post("/otherproperty/update/:id", otherpropertyController.otherproperty_update)
router.delete("/otherproperty/delete/:id", otherpropertyController.otherproperty_delete)
  // other property Enquiry 
router.post("/otherproperty/enquiry/insert",otherpropertyController.otherEnquiry_insert) 
router.post("/otherproperty/enquiry/update/:id",otherpropertyController.otherEnquiry_Update) 
router.get("/otherproperty/enquiry/viewAll",otherpropertyController.otherEnquiry_viewAll) 
router.get("/otherproperty/enquiry/view/:id",otherpropertyController.otherEnquiry_view)
router.delete("/otherproperty/enquiry/delete/:id",otherpropertyController.otherEnquiry_delete)





// router.post("/mail",rentController.email)


module.exports = router