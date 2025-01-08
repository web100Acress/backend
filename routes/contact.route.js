const router = require("./web");
const contactController = require("../Controller/AdminController/FrontController/ContactController");

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

module.exports = router;