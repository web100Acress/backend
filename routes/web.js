const express = require('express')
const router = express.Router()


// Require Controller Front
const homeController = require('../Controller/AdminController/FrontController/HomeController')
const contactController = require('../Controller/AdminController/FrontController/ContactController')

 

//Router for front controller
router.get('/', homeController.home)
router.get('/about', homeController.about)

 // router for front contact page
router.get('/contact', homeController.contact)
router.post('/contact_Insert',contactController.contact_Insert)
router.get('/blog', homeController.blog)
router.get('/agent', homeController.agent)


// Admin Controller routing
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