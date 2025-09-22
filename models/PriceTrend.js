const mongoose = require('mongoose');

const priceTrendSchema = new mongoose.Schema({
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
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RegisterData',
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
priceTrendSchema.index({ area: 1 });
priceTrendSchema.index({ isActive: 1, createdAt: -1 });
priceTrendSchema.index({ createdBy: 1 });

module.exports = mongoose.model('PriceTrend', priceTrendSchema);
