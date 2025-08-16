const express = require("express");
const upload = require("../aws/multerConfig");
const router = express.Router();
const ContentWriterVerify = require("../middleware/ContentWriterVerify");
const blogController = require("../Controller/AdminController/FrontController/BlogController");

router.post(
    "/insert",
    ContentWriterVerify,
    upload.single("blog_Image"),
    blogController.blog_insert,
  );
  router.get("/draft/view", blogController.Draft_view);
  router.get("/admin/view", blogController.admin_blog_view);
  router.get("/view", blogController.blog_view);
  router.get("/view/:id", blogController.blog_viewId);
  router.get("/edit/:id", blogController.blog_edit);
  router.put(
    "/update/:id",
    ContentWriterVerify,
    upload.single("blog_Image"),
    blogController.blog_update,
  );
  router.patch(
    "/update/:id",
    ContentWriterVerify,
    blogController.blog_update_ispublished,
  );
  router.delete("/delete/:id",ContentWriterVerify, blogController.blog_delete);

module.exports = router;