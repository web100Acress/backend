const mongoose = require('mongoose');

const insightContactSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit Indian mobile number']
  },
  inquiryType: {
    type: String,
    required: [true, 'Inquiry type is required'],
    enum: {
      values: ['General', 'Property Purchase', 'Property Sale', 'Investment', 'Consultation', 'Support'],
      message: 'Please select a valid inquiry type'
    },
    default: 'General'
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  source: {
    type: String,
    default: 'GetInTouch Form',
    enum: ['GetInTouch Form', 'DarkCTA Form', 'Contact Page', 'Other']
  },
  status: {
    type: String,
    enum: ['New', 'In Progress', 'Completed', 'Cancelled'],
    default: 'New'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
insightContactSchema.index({ createdAt: -1 });
insightContactSchema.index({ email: 1 });
insightContactSchema.index({ status: 1 });
insightContactSchema.index({ inquiryType: 1 });

// Virtual for full name
insightContactSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to update the updatedAt field
insightContactSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('InsightContact', insightContactSchema);
