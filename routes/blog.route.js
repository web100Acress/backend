const express = require("express");
const upload = require("../aws/multerConfig");
const router = express.Router();
const ContentWriterVerify = require("../middleware/ContentWriterVerify");
const blogController = require("../Controller/AdminController/FrontController/BlogController");

// Inline image upload for editor content
router.post(
  "/upload-image",
  ContentWriterVerify,
  upload.single("image"),
  blogController.upload_inline_image,
);

router.post(
    "/insert",
    ContentWriterVerify,
    upload.single("blog_Image"),
    blogController.blog_insert,
  );
  
  // Slug availability check
  router.get("/slug/:slug", blogController.slug_check);
  // Categories
  router.get("/categories", blogController.list_categories);
  router.post("/categories", ContentWriterVerify, blogController.create_category);
  // Project search for related projects
  router.get("/search-projects", blogController.search_projects);
  router.get("/draft/view", blogController.Draft_view);
  router.get("/admin/view", blogController.admin_blog_view);
  router.get("/view", blogController.blog_view);
  router.get("/view/:id", blogController.blog_viewId);
  router.get("/edit/:id", blogController.blog_edit);
  
  // Blog enquiries
  router.post("/enquiry", blogController.submit_blog_enquiry); // public
  router.get("/enquiry", ContentWriterVerify, blogController.list_blog_enquiries); // admin
  router.delete("/enquiry/:id", ContentWriterVerify, blogController.delete_blog_enquiry); // admin
  
  // Update blog with featured image (catch Multer errors early)
  router.put(
    "/update/:id",
    ContentWriterVerify,
    (req, res, next) => {
      upload.single("blog_Image")(req, res, (err) => {
        if (err) {
          const msg = err?.message || "File upload error";
          return res.status(400).json({ message: msg });
        }
        next();
      });
    },
    blogController.blog_update,
  );
  router.patch(
    "/update/:id",
    ContentWriterVerify,
    blogController.blog_update_ispublished,
  );
  router.delete("/delete/:id", ContentWriterVerify, blogController.blog_delete);

module.exports = router;