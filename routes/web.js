const express = require('express')
const router = express.Router()


// Require Controller Front
const homeController = require('../Controller/AdminController/FrontController/HomeController')
const contactController = require('../Controller/AdminController/FrontController/ContactController')
const blogController = require('../Controller/AdminController/FrontController/BlogController')
const agentController = require('../Controller/AdminController/FrontController/AgentController')
const aboutController = require('../Controller/AdminController/FrontController/AboutController')
const projectController = require('../Controller/AdminController/FrontController/ProjectController')

 

//Router for front home page  controller
router.get('/', homeController.home)
// router for about page 
router.get('/about',aboutController.about)

 // router for front contact page
router.get('/contact',contactController.contact)
router.post('/contact_Insert',contactController.contact_Insert)
 // router for blog page 
router.get('/blog',blogController.blog)
//router for agent page 
router.get('/agent',agentController.agent)
// project
router.get('/project',projectController.project)

// Admin Controller routing
//project
   router.post('/projectInsert',projectController.projectInsert)
   router.get('/projectEdit/:id/edit',projectController.projectEdit)
   router.post('/projectUpdate/:id/update',projectController.projectUpdate)
  
//contact
   //contact banner 
   router.post('/contactbanner_insert',contactController.contactbanner_insert)
   router.get('/contactbanner_edit/:id/edit',contactController.contactbanner_edit)
   router.post('/contactbanner_update/:id/update',contactController.contactbanner_update)
 // Customer Contact routing handler
   router.get('/contact_view/:id/customer',contactController.contact_view)
   router.delete('/contact_delete/:id/delete',contactController.contact_delete)
   // contact page detail handler
   router.post('/contact_pagedetail',contactController.contact_pagedetail)
   router.get('/contact_pagedetail_edit/:id/edit',contactController.contact_pagedetail_edit)
   router.post('/contact_pagedetail_update/:id/update',contactController.contact_pagedetail_update)
module.exports = router