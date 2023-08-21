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


 

//Router for front home page  controller
router.get('/', homeController.home)
// router for about page 
router.get('/about',aboutController.about)

 // router for front contact page
router.get('/contact',contactController.contact)

 // router for blog page 
router.get('/blog',blogController.blog)
//router for agent page 
router.get('/agent',agentController.agent)
// project
router.get('/project',projectController.project)

// Admin Controller routing
//projectDetail page 
     //page with detail 
   router.post('/projectInsert',projectController.projectInsert)
   router.get('/projectView/:projectName/view',projectController.projectView)
   router.get('/projectEdit/:id/edit',projectController.projectEdit)
   router.post('/projectUpdate/:id/update',projectController.projectUpdate)
   router.delete('/projectDelete/:id/delete',projectController.projectDelete)
      //from
   router.post('/userInsert',projectController.userInsert)
   router.delete("/userdataDelete/:id/delete",projectController.userdataDelete)
//contact
 // Customer Contact routing handler
   router.post('/contact_Insert',contactController.contact_Insert)
   router.get('/contact_view/:id/customer',contactController.contact_view)
   router.delete('/contact_delete/:id/delete',contactController.contact_delete)
   // contact page detail handler
   router.post('/contact_pagedetail',contactController.contact_pagedetail)
   router.get('/contact_pagedetail_edit/:id/edit',contactController.contact_pagedetail_edit)
   router.post('/contact_pagedetail_update/:id/update',contactController.contact_pagedetail_update)
   router.get('/contact_pagedetail_view/:id/view',contactController.contact_pagedetail_view)
   router.delete('/contact_pagedetail_delete/:id/delete',contactController.contact_pagedetail_delete)
//Property
    //Buy
    router.post('/property/buycommercialInsert',BuyController.buycommercialInsert)  
    router.get('/property/:type/buyCommercial',BuyController.buycommercialView) 
    router.get('/property/:projectName/:type/buyCommercial',BuyController.view)

    router.get('/property/:id/edit',BuyController.buycommercialEdit)
    router.post('/property/:id/update',BuyController.buycommercialUpdate)
    router.delete('/property/:id/delete',BuyController.buycommercialDelete)
    //rent
    router.post('/property/rentInsert',rentController.rentInsert)
    router.get('/property/:id/rentedit',rentController.rentEdit)
    router.get('/property/:type/rentView',rentController.rentView)
    router.post("/property/:id/rentUpdate",rentController.rentUpdate)
    router.delete('/property/:id/rentDelete',rentController.rentDelete)

module.exports = router