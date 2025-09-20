const mongoose = require('mongoose');

const smallBannerSchema = new mongoose.Schema({
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
    trim: true,
    lowercase: true
  },
  desktopImage: {
    url: {
      type: String
    },
    cdn_url: {
      type: String
    }
  },
  mobileImage: {
    url: {
      type: String
    },
    cdn_url: {
      type: String
    }
  },
  link: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  position: {
    type: String,
    enum: ['top', 'bottom', 'left', 'right'],
    default: 'bottom'
  },
  size: {
    type: String,
    enum: ['small', 'medium', 'large'],
    default: 'small'
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
smallBannerSchema.index({ isActive: 1, order: 1 });
smallBannerSchema.index({ slug: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('SmallBanner', smallBannerSchema);
