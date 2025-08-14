const express = require("express");
const PostPropertyController = require("../Controller/AdminController/FrontController/PostPropertyController");
const authAdmin = require("../middleware/registerAuth");
const adminVerify = require("../middleware/adminVerify");
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
router.get("/view/allusers",adminVerify, PostPropertyController.postPerson_View);
router.get("/view/allListedProperty",adminVerify, PostPropertyController.postPerson_View_AllListedProperty);
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

//Route to update the property by Admin
router.post(
  "/propertyoneUpdate/:id",
  adminVerify,
  upload.fields([
    { name: "frontImage", maxCount: 1 },
    { name: "otherImage", maxCount: 20 },
  ]),
  PostPropertyController.postProperty_Update,
);

//Route to update the property by USer
router.post(
  "/propertyoneUserUpdate/:id",
  upload.fields([
    { name: "frontImage", maxCount: 1 },
    { name: "otherImage", maxCount: 20 },
  ]),
  PostPropertyController.postProerty_User_Update,
);
router.delete(
  "/propertyDelete/:id",
  adminVerify,
  PostPropertyController.postProperty_Delete,
);
router.get("/postEnq_view", PostPropertyController.postEnquiry_view);
router.post("/postEnquiry", PostPropertyController.postPropertyEnquiry);



module.exports = router;
