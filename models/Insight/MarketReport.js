const mongoose = require('mongoose');

const marketReportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  period: {
    type: String,
    required: [true, 'Period is required'],
    enum: [
      'Q1 2023', 'Q2 2023', 'Q3 2023', 'Q4 2023', 'Annual 2023',
      'Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024', 'Annual 2024',
      'Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025', 'Annual 2025'
    ]
  },
  type: {
    type: String,
    required: [true, 'Report type is required'],
    enum: ['PDF', 'Excel', 'Infographic']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  fileUrl: {
    type: String,
    required: [true, 'File URL is required']
  },
  fileName: {
    type: String,
    required: [true, 'File name is required']
  },
  fileType: {
    type: String,
    required: [true, 'File type is required']
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, { timestamps: true });

// Indexes for better query performance
marketReportSchema.index({ city: 1, period: 1, type: 1 });

const MarketReport = mongoose.model('MarketReport', marketReportSchema);

module.exports = MarketReport;
