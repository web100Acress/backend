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
    locality: {
      type: String,
      required: true,
      trim: true
    },
    zone: {
      type: String,
      required: true,
      default: 'East',
      enum: ['East', 'West', 'North', 'South', 'Central']
    },
    rate: {
      type: Number,
      required: true,
      min: 0
    },
    change5y: {
      type: Number,
      required: true,
      min: -1000,
      max: 1000
    },
    yield: {
      type: Number,
      required: true,
      min: 0,
      max: 1000
    },
    projectUrl: {
      type: String,
      required: false,
      trim: true,
      default: ''
    }
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
