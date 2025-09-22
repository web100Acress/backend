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
    default: 'ncr'
  },
  banner: {
    type: String,
    required: true,
    trim: true
  },
  localities: [{
    type: String,
    trim: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RegisterData',
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true
  },
  coordinates: {
    lat: {
      type: Number
    },
    lng: {
      type: Number
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
citySchema.index({ category: 1, name: 1 });
citySchema.index({ isActive: 1 });
citySchema.index({ name: 1 }, { unique: true });
citySchema.index({ createdBy: 1 });

module.exports = mongoose.model('City', citySchema);
