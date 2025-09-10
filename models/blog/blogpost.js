const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema({
  blog_Image: {
    public_id: {
      type: String,
    },
    url: {
      type: String,
    },
  },
  blog_Title: {
    type: String,
  },
  // SEO fields
  metaTitle: {
    type: String,
    trim: true,
  },
  metaDescription: {
    type: String,
    trim: true,
  },
  // URL slug (unique)
  slug: {
    type: String,
    trim: true,
    unique: true,
    index: true,
  },
  blog_Description: {
    type: String,
  },
  // FAQ support
  enableFAQ: {
    type: Boolean,
    default: false,
    index: true,
  },
  faqs: [
    new mongoose.Schema({
      question: { type: String, trim: true },
      answer: { type: String }, // allow HTML
    }, { _id: false })
  ],
  author: {
    type: String,
    default: "Admin",
  },
  blog_Category: {
    type: String,
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  // Optional list of related projects to feature on the blog page
  relatedProjects: [
    new mongoose.Schema({
      project_url: { type: String, trim: true }, // canonical slug (pUrl)
      projectName: { type: String, trim: true },
      thumbnail: { type: String, trim: true }, // optional cached thumbnail URL
    }, { _id: false })
  ]
  // Using the csdkccn subdocument schema as an array in the main schema
},{timestamps: true});

// Performance indexes for fast listings
// Compound index used by public listing: find({ isPublished: true }).sort({ createdAt: -1 })
blogSchema.index({ isPublished: 1, createdAt: -1 });
// Helpful standalone index for createdAt sorting in admin listing
blogSchema.index({ createdAt: -1 });

// helper to slugify strings
function slugify(text) {
  return (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Ensure slug exists and is unique on save
blogSchema.pre('save', async function(next) {
  try {
    if (!this.slug) {
      this.slug = slugify(this.blog_Title);
    } else {
      this.slug = slugify(this.slug);
    }

    if (!this.slug) return next();

    // Ensure uniqueness by appending -1, -2 ... if needed
    let base = this.slug;
    let candidate = base;
    let counter = 1;
    // Exclude current doc id when checking
    while (await this.constructor.exists({ slug: candidate, _id: { $ne: this._id } })) {
      candidate = `${base}-${counter++}`;
    }
    this.slug = candidate;
    next();
  } catch (err) {
    next(err);
  }
});

const blogModel = mongoose.model("Blog", blogSchema);

module.exports = blogModel;
