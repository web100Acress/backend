const mongoose = require('mongoose');

const sideBannerSchema = new mongoose.Schema({
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
  link: {
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
    enum: ['right', 'left'],
    default: 'right'
  },
  visibilitySettings: {
    showOnScroll: {
      type: Boolean,
      default: true
    },
    scrollOffset: {
      type: Number,
      default: 96
    },
    height: {
      type: String,
      default: 'calc(100vh - 120px)'
    }
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RegisterData'
  }
}, {
  timestamps: true
});

// Index for better query performance
sideBannerSchema.index({ isActive: 1, order: 1 });
sideBannerSchema.index({ slug: 1 }, { unique: true, sparse: true });
sideBannerSchema.index({ position: 1 });

module.exports = mongoose.model('SideBanner', sideBannerSchema);
