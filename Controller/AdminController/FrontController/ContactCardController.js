const ContactCard = require("../../../models/contactCard/contactCard");
const { validationResult } = require("express-validator");
const QRCode = require("qrcode");
const vCard = require("vcards-js");
const path = require("path");

// Helper to extract a browser-accessible URL from an uploaded file object
const getFileUrl = (file) => {
  if (!file) return undefined;

  // If using S3/multer-s3, location will already be a full URL
  if (file.location) {
    return file.location;
  }

  // If using S3/multer-s3, key contains the S3 path and we can construct the URL
  if (file.key) {
    const { BUCKET } = require("../../../aws/s3Config");
    const awsRegion = process.env.AWS_REGION || 'ap-south-1';
    return `https://${BUCKET}.s3.${awsRegion}.amazonaws.com/${file.key}`;
  }

  // For local disk storage, map filesystem path to /uploads/<filename>
  if (file.path) {
    const filename = path.basename(file.path);
    return `/uploads/${filename}`;
  }

  return undefined;
};

class ContactCardController {
  // Create a new contact card
  static async createCard(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Validation failed:', errors.array());
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const {
        name,
        email,
        phone,
        whatsapp,
        company,
        designation,
        website,
        brandColor,
        fontStyle,
        theme,
        template,
        socialLinks,
        bio,
        address,
        slug,
        company_logo_url,
      } = req.body;

      // Handle uploads if provided
      const files = req.files || {};
      const logoFile = files.logo && files.logo[0];
      const profileImageFile = files.profile_image && files.profile_image[0];
      const bannerImageFile = files.banner_image && files.banner_image[0];

      const logoUrl = getFileUrl(logoFile);

      // Create new contact card
      const contactCard = new ContactCard({
        name,
        email,
        phone,
        whatsapp: whatsapp && whatsapp.trim() !== '' ? whatsapp : undefined,
        company: company || undefined,
        designation: designation || undefined,
        website: website && website.trim() !== '' ? website : undefined,
        logo: logoUrl,
        brandColor,
        fontStyle,
        theme,
        template: template || 'modern', // Default to 'modern' if not provided
        socialLinks: socialLinks ? (typeof socialLinks === 'string' ? JSON.parse(socialLinks) : socialLinks) : {},
        bio: bio || undefined,
        address: address ? (typeof address === 'string' ? JSON.parse(address) : address) : {},
        slug,
        profile_image_url: profileImageFile ? getFileUrl(profileImageFile) : undefined,
        banner_image_url: bannerImageFile ? getFileUrl(bannerImageFile) : undefined,
        company_logo_url: company_logo_url || undefined,
        createdBy: req.user?.id, // From auth middleware
      });

      await contactCard.save();

      res.status(201).json({
        success: true,
        message: "Contact card created successfully",
        data: contactCard,
        url: contactCard.fullUrl,
      });
    } catch (error) {
      console.error("Error creating contact card:", error);
      console.error("Request body:", req.body);
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
        errors: error.errors
      });
      
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(400).json({
          success: false,
          message: `${field} already exists. Please choose a different ${field}.`,
        });
      }

      // Handle validation errors
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationErrors,
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to create contact card",
        error: error.message,
      });
    }
  }

  // Get contact card by slug (public endpoint)
  static async getCardBySlug(req, res) {
    try {
      const { slug } = req.params;

      const contactCard = await ContactCard.findOne({ 
        slug, 
        isActive: true 
      });

      if (!contactCard) {
        return res.status(404).json({
          success: false,
          message: "Contact card not found",
        });
      }

      // Increment view count (async, don't wait)
      contactCard.incrementView().catch(err => 
        console.error("Error incrementing view:", err)
      );

      res.status(200).json({
        success: true,
        data: contactCard,
      });
    } catch (error) {
      console.error("Error fetching contact card:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch contact card",
        error: error.message,
      });
    }
  }

  // Update contact card
  static async updateCard(req, res) {
    try {
      const { id } = req.params;
      const errors = validationResult(req);
      
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const updateData = { ...req.body };

      // Handle uploaded files if provided
      const files = req.files || {};
      const logoFile = files.logo && files.logo[0];
      const profileImageFile = files.profile_image && files.profile_image[0];
      const bannerImageFile = files.banner_image && files.banner_image[0];

      if (logoFile) {
        updateData.logo = getFileUrl(logoFile);
      }
      if (profileImageFile) {
        updateData.profile_image_url = getFileUrl(profileImageFile);
      }
      if (bannerImageFile) {
        updateData.banner_image_url = getFileUrl(bannerImageFile);
      }

      // Parse JSON fields if they exist and handle empty fields
      if (updateData.socialLinks) {
        updateData.socialLinks = typeof updateData.socialLinks === 'string' ? JSON.parse(updateData.socialLinks) : updateData.socialLinks;
      }
      if (updateData.address) {
        updateData.address = typeof updateData.address === 'string' ? JSON.parse(updateData.address) : updateData.address;
      }
      
      // Handle empty website field
      if (updateData.website && updateData.website.trim() === '') {
        updateData.website = undefined;
      }
      
      // Handle empty optional fields
      ['company', 'designation', 'bio', 'profile_image_url', 'banner_image_url', 'company_logo_url', 'whatsapp'].forEach(field => {
        if (updateData[field] === '') {
          updateData[field] = undefined;
        }
      });
      
      // Set default template if not provided (for backward compatibility with old cards)
      if (!updateData.template) {
        updateData.template = 'modern';
      }

      const contactCard = await ContactCard.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!contactCard) {
        return res.status(404).json({
          success: false,
          message: "Contact card not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Contact card updated successfully",
        data: contactCard,
      });
    } catch (error) {
      console.error("Error updating contact card:", error);
      
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(400).json({
          success: false,
          message: `${field} already exists. Please choose a different ${field}.`,
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to update contact card",
        error: error.message,
      });
    }
  }

  // Delete contact card
  static async deleteCard(req, res) {
    try {
      const { id } = req.params;

      const contactCard = await ContactCard.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      );

      if (!contactCard) {
        return res.status(404).json({
          success: false,
          message: "Contact card not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Contact card deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting contact card:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete contact card",
        error: error.message,
      });
    }
  }

  // Get all contact cards (admin)
  static async getAllCards(req, res) {
    try {
      const { page = 1, limit = 10, search, status } = req.query;
      
      const query = {};
      
      // Filter by status
      if (status === "active") {
        query.isActive = true;
      } else if (status === "inactive") {
        query.isActive = false;
      }

      // Search functionality
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { company: { $regex: search, $options: "i" } },
          { designation: { $regex: search, $options: "i" } },
        ];
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },
        populate: {
          path: "createdBy",
          select: "name email",
        },
      };

      const result = await ContactCard.paginate(query, options);

      res.status(200).json({
        success: true,
        data: result.docs,
        pagination: {
          currentPage: result.page,
          totalPages: result.totalPages,
          totalItems: result.totalDocs,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
        },
      });
    } catch (error) {
      console.error("Error fetching contact cards:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch contact cards",
        error: error.message,
      });
    }
  }

  // Get contact card by ID (admin)
  static async getCardById(req, res) {
    try {
      const { id } = req.params;

      const contactCard = await ContactCard.findById(id).populate(
        "createdBy",
        "name email"
      );

      if (!contactCard) {
        return res.status(404).json({
          success: false,
          message: "Contact card not found",
        });
      }

      res.status(200).json({
        success: true,
        data: contactCard,
      });
    } catch (error) {
      console.error("Error fetching contact card:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch contact card",
        error: error.message,
      });
    }
  }

  // Generate and download vCard
  static async downloadVCard(req, res) {
    try {
      const { slug } = req.params;

      const contactCard = await ContactCard.findOne({ 
        slug, 
        isActive: true 
      });

      if (!contactCard) {
        return res.status(404).json({
          success: false,
          message: "Contact card not found",
        });
      }

      // Create vCard
      const vcard = vCard();
      vcard.firstName = contactCard.name.split(" ")[0] || "";
      vcard.lastName = contactCard.name.split(" ").slice(1).join(" ") || "";
      vcard.organization = contactCard.company || "";
      vcard.title = contactCard.designation || "";
      vcard.email = contactCard.email;
      vcard.cellPhone = contactCard.phone;
      vcard.url = contactCard.website || contactCard.fullUrl;

      // Add address if available
      if (contactCard.address) {
        vcard.homeAddress.street = contactCard.address.street || "";
        vcard.homeAddress.city = contactCard.address.city || "";
        vcard.homeAddress.stateProvince = contactCard.address.state || "";
        vcard.homeAddress.postalCode = contactCard.address.zipCode || "";
        vcard.homeAddress.countryRegion = contactCard.address.country || "";
      }

      // Add social links as URLs
      if (contactCard.socialLinks) {
        if (contactCard.socialLinks.linkedin) {
          vcard.socialUrls.linkedin = contactCard.socialLinks.linkedin;
        }
        if (contactCard.socialLinks.twitter) {
          vcard.socialUrls.twitter = contactCard.socialLinks.twitter;
        }
      }

      // Add bio as note
      if (contactCard.bio) {
        vcard.note = contactCard.bio;
      }

      // Increment download count (async)
      contactCard.incrementDownload().catch(err => 
        console.error("Error incrementing download:", err)
      );

      // Set headers for file download
      res.setHeader("Content-Type", "text/vcard");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${contactCard.slug}.vcf"`
      );

      res.status(200).send(vcard.getFormattedString());
    } catch (error) {
      console.error("Error generating vCard:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate vCard",
        error: error.message,
      });
    }
  }

  // Generate QR Code
  static async generateQRCode(req, res) {
    try {
      const { slug } = req.params;

      const contactCard = await ContactCard.findOne({
        slug,
        isActive: true
      });

      if (!contactCard) {
        return res.status(404).json({
          success: false,
          message: "Contact card not found",
        });
      }

      // Use environment-based URL for QR codes (consistent with fullUrl)
      const { getContactCardUrl } = require('../../../utils/urlUtils');
      const cardUrl = getContactCardUrl(slug);

      const qrCodeDataURL = await QRCode.toDataURL(cardUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: contactCard.brandColor || "#000000",
          light: "#FFFFFF",
        },
      });

      res.status(200).json({
        success: true,
        data: {
          qrCode: qrCodeDataURL,
          url: cardUrl,
        },
      });
    } catch (error) {
      console.error("Error generating QR code:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate QR code",
        error: error.message,
      });
    }
  }

  // Track share action
  static async trackShare(req, res) {
    try {
      const { slug } = req.params;
      const { platform } = req.body; // whatsapp, email, copy, etc.

      const contactCard = await ContactCard.findOne({ 
        slug, 
        isActive: true 
      });

      if (!contactCard) {
        return res.status(404).json({
          success: false,
          message: "Contact card not found",
        });
      }

      // Increment share count
      await contactCard.incrementShare();

      res.status(200).json({
        success: true,
        message: "Share tracked successfully",
      });
    } catch (error) {
      console.error("Error tracking share:", error);
      res.status(500).json({
        success: false,
        message: "Failed to track share",
        error: error.message,
      });
    }
  }

  // Get analytics for a contact card
  static async getCardAnalytics(req, res) {
    try {
      const { id } = req.params;

      const contactCard = await ContactCard.findById(id);

      if (!contactCard) {
        return res.status(404).json({
          success: false,
          message: "Contact card not found",
        });
      }

      res.status(200).json({
        success: true,
        data: {
          analytics: contactCard.analytics,
          url: contactCard.fullUrl,
          slug: contactCard.slug,
        },
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch analytics",
        error: error.message,
      });
    }
  }

  // Check slug availability
  static async checkSlugAvailability(req, res) {
    try {
      const { slug } = req.params;
      const { excludeId } = req.query;

      const query = { slug };
      if (excludeId) {
        query._id = { $ne: excludeId };
      }

      const existingCard = await ContactCard.findOne(query);

      res.status(200).json({
        success: true,
        available: !existingCard,
        message: existingCard
          ? "Slug is already taken"
          : "Slug is available",
      });
    } catch (error) {
      console.error("Error checking slug availability:", error);
      res.status(500).json({
        success: false,
        message: "Failed to check slug availability",
        error: error.message,
      });
    }
  }

  // Get contact cards count for admin dashboard
  static async getContactCardsCount(req, res) {
    try {
      const count = await ContactCard.countDocuments({ isActive: true });

      res.status(200).json({
        success: true,
        count: count,
      });
    } catch (error) {
      console.error("Error fetching contact cards count:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch contact cards count",
        error: error.message,
      });
    }
  }
}

module.exports = ContactCardController;
