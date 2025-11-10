const mongoose = require("mongoose");

const contactCardSchema = new mongoose.Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^[\+]?[\d\s\-\(\)\.]{8,20}$/, "Please enter a valid phone number"],
    },
    company: {
      type: String,
      trim: true,
      maxlength: [100, "Company name cannot exceed 100 characters"],
    },
    designation: {
      type: String,
      trim: true,
      maxlength: [100, "Designation cannot exceed 100 characters"],
    },
    website: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, "Please enter a valid website URL"],
    },
    
    // URL and Identification
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"],
    },
    
    // Branding and Customization
    logo: {
      type: String, // S3 URL for logo image
      trim: true,
    },
    profile_image_url: {
      type: String, // S3 URL for profile picture
      trim: true,
    },
    company_logo_url: {
      type: String, // S3 URL for company logo
      trim: true,
    },
    brandColor: {
      type: String,
      default: "#3B82F6", // Default blue color
      match: [/^#[0-9A-Fa-f]{6}$/, "Please enter a valid hex color code"],
    },
    fontStyle: {
      type: String,
      enum: ["modern", "classic", "elegant", "bold"],
      default: "modern",
    },
    theme: {
      type: String,
      enum: ["light", "dark", "gradient"],
      default: "light",
    },
    
    // Social Links (optional)
    socialLinks: {
      linkedin: {
        type: String,
        trim: true,
        match: [/^https:\/\/(www\.)?linkedin\.com\/.*/, "Please enter a valid LinkedIn URL"],
      },
      twitter: {
        type: String,
        trim: true,
        match: [/^https:\/\/(www\.)?twitter\.com\/.*/, "Please enter a valid Twitter URL"],
      },
      instagram: {
        type: String,
        trim: true,
        match: [/^https:\/\/(www\.)?instagram\.com\/.*/, "Please enter a valid Instagram URL"],
      },
      facebook: {
        type: String,
        trim: true,
        match: [/^https:\/\/(www\.)?facebook\.com\/.*/, "Please enter a valid Facebook URL"],
      },
    },
    
    // Analytics and Tracking
    analytics: {
      totalViews: {
        type: Number,
        default: 0,
      },
      totalDownloads: {
        type: Number,
        default: 0,
      },
      totalShares: {
        type: Number,
        default: 0,
      },
      lastViewed: {
        type: Date,
      },
    },
    
    // Status and Metadata
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to admin/user who created this card
    },
    
    // Additional Information
    bio: {
      type: String,
      trim: true,
      maxlength: [500, "Bio cannot exceed 500 characters"],
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Helper function to get base URL based on environment
const getBaseUrl = () => {
  // Check if we're in production environment
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    return 'https://100acress.com';
  } else {
    // Development environment - use localhost
    const port = process.env.FRONTEND_PORT || '3000';
    return `http://localhost:${port}`;
  }
};

// Virtual for full URL
contactCardSchema.virtual("fullUrl").get(function () {
  return `${getBaseUrl()}/hi/${this.slug}`;
});

// Virtual for QR code URL
contactCardSchema.virtual("qrCodeUrl").get(function () {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(this.fullUrl)}`;
});

// Index for better search performance
contactCardSchema.index({ slug: 1 });
contactCardSchema.index({ email: 1 });
contactCardSchema.index({ name: "text", company: "text", designation: "text" });
contactCardSchema.index({ createdAt: -1 });
contactCardSchema.index({ isActive: 1 });

// Pre-save middleware to check slug uniqueness and generate fallback if needed
contactCardSchema.pre("save", async function (next) {
  // If slug is provided, check for uniqueness
  if (this.slug) {
    const existingCard = await this.constructor.findOne({ 
      slug: this.slug, 
      _id: { $ne: this._id } 
    });
    
    if (existingCard) {
      const error = new Error('Slug already exists. Please choose a different slug.');
      error.name = 'ValidationError';
      return next(error);
    }
  } else if (this.name) {
    // Fallback: generate slug from name if not provided
    let baseSlug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single
      .trim("-"); // Remove leading/trailing hyphens
    
    // Ensure uniqueness
    let slug = baseSlug;
    let counter = 1;
    
    while (await this.constructor.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  next();
});

// Method to increment view count
contactCardSchema.methods.incrementView = function () {
  this.analytics.totalViews += 1;
  this.analytics.lastViewed = new Date();
  return this.save();
};

// Method to increment download count
contactCardSchema.methods.incrementDownload = function () {
  this.analytics.totalDownloads += 1;
  return this.save();
};

// Method to increment share count
contactCardSchema.methods.incrementShare = function () {
  this.analytics.totalShares += 1;
  return this.save();
};

// Static method to find active cards
contactCardSchema.statics.findActive = function () {
  return this.find({ isActive: true });
};

// Static method to search cards
contactCardSchema.statics.searchCards = function (query) {
  return this.find({
    $and: [
      { isActive: true },
      {
        $or: [
          { name: { $regex: query, $options: "i" } },
          { company: { $regex: query, $options: "i" } },
          { designation: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } },
        ],
      },
    ],
  });
};

// Add pagination plugin
const mongoosePaginate = require('mongoose-paginate-v2');
contactCardSchema.plugin(mongoosePaginate);

const ContactCard = mongoose.model("ContactCard", contactCardSchema);

module.exports = ContactCard;
