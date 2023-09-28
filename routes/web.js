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
const registerController = require('../Controller/AdminController/FrontController/RegisterController')
const authAdmin = require('../middleware/registerAuth')
const PostPropertyController = require('../Controller/AdminController/FrontController/PostPropertyController')
const newlaunchController = require('../Controller/AdminController/FrontController/NewlauchController')
const otherpropertyController = require('../Controller/AdminController/FrontController/OtherpropertyController')





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
router.get('/projectView/:projectName/view', projectController.projectView)
router.get('/projectView/viewAll', projectController.projectviewAll)
router.get('/projectEdit/:id/edit', projectController.projectEdit)
router.post('/projectUpdate/:id/update', projectController.projectUpdate)
router.delete('/projectDelete/:id/delete', projectController.projectDelete)
//from
router.post('/userInsert', projectController.userInsert)
router.delete("/userdataDelete/delete/:id", projectController.userdataDelete)
//contact
// Customer Contact routing handler
router.post('/contact_Insert', contactController.contact_Insert)
router.get('/contact_view/:id/customer', contactController.contact_view)
router.get("/contact/viewAll",contactController.contactviewAll)
router.delete('/contact_delete/:id/delete', contactController.contact_delete)
// contact page detail handler
router.post('/contact_pagedetail', contactController.contact_pagedetail)
router.get('/contact_pagedetail_edit/:id/edit', contactController.contact_pagedetail_edit)
router.post('/contact_pagedetail_update/:id/update', contactController.contact_pagedetail_update)
router.get('/contact_pagedetail_view/:id/view', contactController.contact_pagedetail_view)
router.get('/contact_pagedetail_viewAll',contactController.contactpagedetail_viewAll)
router.delete('/contact_pagedetail_delete/:id/delete', contactController.contact_pagedetail_delete)
//Property
//Buy
router.post('/property/buycommercialInsert', BuyController.buycommercialInsert)
router.get('/property/:type/buyCommercial', BuyController.buycommercialView)
router.get('/property/:projectName/:type/buyCommercial', BuyController.view)
router.get("/property/buyCommercial",BuyController.viewAll)
router.get('/property/:id/edit', BuyController.buycommercialEdit)
router.post('/property/:id/update', BuyController.buycommercialUpdate)
router.delete('/property/:id/delete', BuyController.buycommercialDelete)
//rent
router.post('/property/rentInsert', rentController.rentInsert)
router.get('/property/:id/rentedit', rentController.rentEdit)
router.get('/property/:type/rentView', rentController.rentView)
router.get("/property/viewAll",rentController.rentViewAll)
router.post("/property/:id/rentUpdate", rentController.rentUpdate)
router.delete('/property/:id/rentDelete', rentController.rentDelete)
//About_Page
//Insert
router.post('/about/aboutInsert', aboutController.aboutInsert)
router.get('/about/:id/aboutView', aboutController.aboutView)
router.get("/about/viewAll",aboutController.aboutViewAll)
router.get('/about/:id/aboutEdit', aboutController.aboutEdit)
router.post('/about/:id/aboutUpdate', aboutController.aboutUpdate)
router.delete('/about/:id/aboutDelete', aboutController.aboutDelete)
//testimonial
router.post('/testimonial/testimonialInsert', aboutController.testimonialInsert)
router.get('/testimonial/testimonialView/:id', aboutController.testimonialView)
router.get("/testimonial/viewAll",aboutController.testimonialViewAll)
router.get('/testimonial/testimonialEdit/:id', aboutController.testimonialEdit)
router.post('/testimonial/testimonialUpdate/:id', aboutController.testimonialUpdate)
router.delete('/testimonial/testimonialDelete/:id', aboutController.testimonialDelete)
//Register
router.post('/register', registerController.register)
router.post('/verify_Login', registerController.verify_Login)
router.get('/logout', registerController.logout)                                                        
router.post('/forgetPassword', registerController.forgetPassword)
router.post('/reset/:token', registerController.reset)

// Post Property 
//post person 
router.post('/postPerson/register', PostPropertyController.postPerson_Register)
router.post('/postPerson/verify_Login', PostPropertyController.postPerson_VerifyLogin)
router.get('/postPerson/logout', PostPropertyController.postPerson_logout)
router.post('/postPerson/postProperty_forget', PostPropertyController.postPerson_forget)
router.post('/postPerson/reset/:token', PostPropertyController.postPerson_reset)
router.get("/postPerson/view", PostPropertyController.postPerson_View)
router.get('/postPerson/edit/:id', PostPropertyController.postPerson_Edit)
router.post("/postPerson/update/:id", PostPropertyController.postPerson_update)
router.delete("/postPerson/delete/:id",PostPropertyController.postPerson_accountDelete)


//property
router.post('/postPerson/propertyInsert/:id', PostPropertyController.postProperty)
router.get('/postPerson/propertyView/:id', PostPropertyController.postProperty_View)
router.get('/postPerson/propertyoneView/:id', PostPropertyController.postPropertyOne_View)
router.get('/postPerson/propertyoneEdit/:id', PostPropertyController.postProperty_Edit)
router.post('/postPerson/propertyoneUpdate/:id', PostPropertyController.postProperty_Update)
router.delete('/postPerson/propertyDelete/:id', PostPropertyController.postProperty_Delete)
// router.get("/findAll",PostPropertyController.findAll)


//Blog
router.post("/blog/insert", blogController.blog_Insert)
router.get("/blog/blogviewAll",blogController.blogviewAll)
router.get('/blog/view/:id', blogController.blog_View)
router.get('/blog/edit/:id', blogController.blog_Edit)
router.post('/blog/update/:id', blogController.blog_Update)
router.delete('/blog/delete/:id', blogController.blog_delete)
//BlogPst
router.post("/blogPost/insert/:id", blogController.blogPost_insert)
router.get('/blogPost/view/:id', blogController.blogPost_view)
router.get("/blogPost/edit/:id", blogController.blogPost_edit)
router.post("/blogPost/update/:id", blogController.blogPost_update)
router.delete('/blogPost/delete/:id', blogController.blogPost_delete)

// searching
router.get("/property/search/:key", homeController.search)
 //searching
 router.post("/postPerson/search",homeController.search_other) 
//new launch 
router.post("/newlaunch/insert", newlaunchController.newlaunch_Insert)
router.get("/newlaunch/view/:id", newlaunchController.newlaunch_view)
router.get("/newlaunch/viewAll", newlaunchController.newlaunch_viewAll)
router.get("/newlaunch/edit/:id", newlaunchController.newlaunch_edit)
router.post("/newlaunch/update/:id", newlaunchController.newlaunch_update)
router.delete("/newlaunch/delete/:id", newlaunchController.newlaunch_delete)
//other Property

router.post("/otherproperty/insert", otherpropertyController.otherproperty_Insert)
router.get("/otherproperty/viewAll", otherpropertyController.otherproperty_viewAll)
router.get('/otherproperty/view/:id', otherpropertyController.otherproperty_view)
router.get("/otherproperty/edit/:id", otherpropertyController.otherproperty_edit)
router.post("/otherproperty/update/:id", otherpropertyController.otherproperty_update)
router.delete("/otherproperty/delete/:id", otherpropertyController.otherproperty_delete)


module.exports = router