const express = require("express");
const PostPropertyController = require("../Controller/AdminController/FrontController/PostPropertyController");
const authAdmin = require("../middleware/registerAuth");
const upload = require("../aws/multerConfig");

const router = express.Router();

router.post("/otp", PostPropertyController.otpVerify);
router.post("/verifyEmail", PostPropertyController.verifyEmail);
router.post("/register", PostPropertyController.postPerson_Register);
router.get("/Role/:email", PostPropertyController.postPerson_verifyRole);
router.post(
  "/verify_Login",
  authAdmin,
  PostPropertyController.postPerson_VerifyLogin,
);
router.get("/logout", PostPropertyController.postPerson_logout);
router.post("/postProperty_forget", PostPropertyController.postPerson_forget);
router.post("/reset/:token", PostPropertyController.postPerson_reset);
router.get("/view", PostPropertyController.postPerson_View);
router.get("/edit/:id", PostPropertyController.postPerson_Edit);
router.post("/update/:id", PostPropertyController.postPerson_update);
router.delete("/delete/:id", PostPropertyController.postPerson_accountDelete);
router.post("/changePassword", PostPropertyController.Post_changePassword);

//property routing
router.post(
  "/propertyInsert/:id",
  upload.fields([
    { name: "frontImage", maxCount: 1 },
    { name: "otherImage", maxCount: 20 },
  ]),
  PostPropertyController.postProperty,
);
router.get("/propertyView/:id", PostPropertyController.postProperty_View);
router.get("/propertyoneView/:id", PostPropertyController.postPropertyOne_View);
router.get("/propertyoneEdit/:id", PostPropertyController.postProperty_Edit);
router.post(
  "/propertyoneUpdate/:id",
  upload.fields([
    { name: "frontImage", maxCount: 1 },
    { name: "otherImage", maxCount: 20 },
  ]),
  PostPropertyController.postProperty_Update,
);
router.delete(
  "/propertyDelete/:id",
  PostPropertyController.postProperty_Delete,
);
router.get("/postEnq_view", PostPropertyController.postEnquiry_view);
router.post("/postEnquiry", PostPropertyController.postPropertyEnquiry);

module.exports = router;
