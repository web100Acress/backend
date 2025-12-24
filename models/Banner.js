const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  subtitle: {
    type: String,
    trim: true
  },
  slug: {
    type: String,
    trim: true
  },
  image: {
    public_id: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    cdn_url: {
      type: String
    }
  },
  mobileImage: {
    public_id: {
      type: String
    },
    url: {
      type: String
    },
    cdn_url: {
      type: String
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RegisterData'
  }
}, {
  timestamps: true
});

// Index for better query performance
bannerSchema.index({ isActive: 1, order: 1 });
bannerSchema.index({ slug: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Banner', bannerSchema);

