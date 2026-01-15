const mongoose = require("mongoose");

const builderSchema = new mongoose.Schema({
  builderName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
// builderSchema.index({ builderName: 1 }); // Removed duplicate index
builderSchema.index({ status: 1 });

module.exports = mongoose.model("Builder", builderSchema);
