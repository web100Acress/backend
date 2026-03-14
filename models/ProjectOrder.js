const mongoose = require('mongoose');

const projectOrderSchema = new mongoose.Schema({
  data: {
    type: Object,
    required: true,
    default: {
      luxury: [],
      trending: [],
      affordable: [],
      sco: [],
      commercial: [],
      budget: [],
      recommended: [],
      desiredLuxury: [],
      budgetPlots: []
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
projectOrderSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Add indexes for better query performance
projectOrderSchema.index({ updatedAt: -1 });
projectOrderSchema.index({ createdAt: -1 });
projectOrderSchema.index({ _id: 1 });

module.exports = mongoose.model('ProjectOrder', projectOrderSchema);


