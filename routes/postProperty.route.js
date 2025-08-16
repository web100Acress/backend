const express = require("express");
const PostPropertyController = require("../Controller/AdminController/FrontController/PostPropertyController");
const authAdmin = require("../middleware/registerAuth");
const adminVerify = require("../middleware/adminVerify");
const upload = require("../aws/multerConfig");
const mongoose = require("mongoose");


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

// REAL DATABASE USER DELETION - corrected to match actual models
router.delete("/deleteUser/:id", adminVerify, async (req, res) => {
  try {
    const userId = req.params.id;

    console.log(`🗑️ Admin attempting to delete user: ${userId}`);

    // Validate user ID format (MongoDB ObjectId)
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    // Use the real user model with embedded postProperty
    const PostUser = require("../models/postProperty/post");

    // Check if user exists before deletion
    const userToDelete = await PostUser.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({
        success: false,
        message: 'User not found in database'
      });
    }

    console.log(`📋 Found user to delete: ${(userToDelete.name) || userToDelete.email} (${userToDelete.email || 'no-email'})`);

    // Determine how many embedded properties will be removed (postProperty is embedded in user)
    const embeddedCount = Array.isArray(userToDelete.postProperty) ? userToDelete.postProperty.length : 0;

    // Delete the user document (removes embedded properties as well)
    const deletedUser = await PostUser.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete user from database'
      });
    }

    // Log successful deletion
    console.log(`✅ Successfully deleted user from database: ${(deletedUser.name) || deletedUser.email} and ${embeddedCount} embedded properties`);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'User permanently deleted from database',
      data: {
        deletedUser: {
          id: deletedUser._id,
          name: deletedUser.name || '',
          email: deletedUser.email || '',
          mobile: deletedUser.mobile || ''
        },
        deletedPropertiesCount: embeddedCount,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Database deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Critical error during database deletion',
      error: process.env.NODE_ENV !== 'production' ? (error && error.message) : 'Internal server error'
    });
  }
});

// Alternative endpoints for user deletion
router.delete("/userDelete/:id", adminVerify, async (req, res) => {
  req.url = `/postPerson/deleteUser/${req.params.id}`;
  req.params.id = req.params.id;
  return router.handle(req, res);
});
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
