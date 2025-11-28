const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const upload = require("../aws/multerS3Config");
const adminVerify = require("../middleware/adminVerify");
const ContactCardController = require("../Controller/AdminController/FrontController/ContactCardController");

// Validation middleware
const validateContactCard = [
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 100 })
    .withMessage("Name cannot exceed 100 characters"),
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),
  body("phone")
    .matches(/^[\+]?[\d\s\-\(\)\.]{8,20}$/)
    .withMessage("Please enter a valid phone number"),
  body("company")
    .optional({ checkFalsy: true })
    .isLength({ max: 100 })
    .withMessage("Company name cannot exceed 100 characters"),
  body("designation")
    .optional({ checkFalsy: true })
    .isLength({ max: 100 })
    .withMessage("Designation cannot exceed 100 characters"),
  body("website")
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!value || value.trim() === '') return true;
      try {
        new URL(value);
        return true;
      } catch {
        throw new Error("Please enter a valid website URL (must include http:// or https://)");
      }
    }),
  body("brandColor")
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage("Please enter a valid hex color code"),
  body("fontStyle")
    .optional()
    .isIn(["modern", "classic", "elegant", "bold"])
    .withMessage("Invalid font style"),
  body("theme")
    .optional()
    .isIn(["light", "dark", "gradient"])
    .withMessage("Invalid theme"),
  body("template")
    .optional()
    .isIn(["modern", "executive", "minimalist", "creative", "premium", "glassmorphism"])
    .withMessage("Invalid template"),
  body("bio")
    .optional({ checkFalsy: true })
    .isLength({ max: 500 })
    .withMessage("Bio cannot exceed 500 characters"),
  body("slug")
    .notEmpty()
    .withMessage("Slug is required")
    .matches(/^[a-z0-9-]+$/)
    .withMessage("Slug can only contain lowercase letters, numbers, and hyphens")
    .isLength({ min: 3, max: 50 })
    .withMessage("Slug must be between 3 and 50 characters"),
  body("company_logo_url")
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!value || value.trim() === '') return true;
      try {
        new URL(value);
        return true;
      } catch {
        throw new Error("Please enter a valid company logo URL");
      }
    }),
];

// Public Routes (no authentication required)

// Get contact card by slug (public view)
router.get("/public/:slug", ContactCardController.getCardBySlug);

// Download vCard file
router.get("/public/:slug/download", ContactCardController.downloadVCard);

// Generate QR code
router.get("/public/:slug/qr", ContactCardController.generateQRCode);

// Track share action
router.post("/public/:slug/share", ContactCardController.trackShare);

// Check slug availability (public for form validation)
router.get("/public/check-slug/:slug", ContactCardController.checkSlugAvailability);

// Admin Routes (authentication required)

// Create new contact card
router.post(
  "/",
  adminVerify,
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "profile_image", maxCount: 1 },
    { name: "banner_image", maxCount: 1 },
  ]),
  validateContactCard,
  ContactCardController.createCard
);

// Get all contact cards (admin dashboard)
router.get("/", adminVerify, ContactCardController.getAllCards);

// Get contact card by ID (admin)
router.get("/:id", adminVerify, ContactCardController.getCardById);

// Update contact card
router.put(
  "/:id",
  adminVerify,
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "profile_image", maxCount: 1 },
    { name: "banner_image", maxCount: 1 },
  ]),
  validateContactCard,
  ContactCardController.updateCard
);

// Delete contact card (soft delete)
router.delete("/:id", adminVerify, ContactCardController.deleteCard);

// Get analytics for a contact card
router.get("/:id/analytics", adminVerify, ContactCardController.getCardAnalytics);

// Get contact cards count for admin dashboard
router.get("/count", ContactCardController.getContactCardsCount);

module.exports = router;
