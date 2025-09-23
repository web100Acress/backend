const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  category: {
    type: String,
    required: true,
    enum: ['ncr', 'metro', 'other'],
    default: 'other'
  },
  banner: {
    public_id: {
      type: String,
      required: false
    },
    url: {
      type: String,
      required: false
    },
    cdn_url: {
      type: String
    }
  },
  localities: [{
    type: String,
    trim: true
  }],
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
citySchema.index({ category: 1, isActive: 1, order: 1 });
citySchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('InsightCity', citySchema);
