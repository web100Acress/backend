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
  }
  // Using the csdkccn subdocument schema as an array in the main schema
},{timestamps: true});

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
