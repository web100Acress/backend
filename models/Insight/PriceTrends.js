const mongoose = require('mongoose');

const priceTrendsSchema = new mongoose.Schema({
  area: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: String,
    required: true,
    trim: true
  },
  rental: {
    type: String,
    required: true,
    trim: true
  },
  trend: {
    type: String,
    required: true,
    enum: ['up', 'down', 'stable'],
    default: 'stable'
  },
  city: {
    type: String,
    required: true,
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
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RegisterData'
  }
}, {
  timestamps: true
});

// Index for better query performance
priceTrendsSchema.index({ city: 1, isActive: 1, order: 1 });
priceTrendsSchema.index({ area: 1, city: 1 }, { unique: true });

module.exports = mongoose.model('InsightPriceTrends', priceTrendsSchema);
