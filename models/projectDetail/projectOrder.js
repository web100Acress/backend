const mongoose = require("mongoose");

const projectOrderSchema = new mongoose.Schema(
  {
    builderName: {
      type: String,
      required: true,
      unique: true,
    },
    customOrder: {
      type: [String], // Array of project IDs in custom order
      default: [],
    },
    hasCustomOrder: {
      type: Boolean,
      default: false,
    },
    randomSeed: {
      type: Number,
      default: null,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: String, // Admin email or user ID
      default: "admin",
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
projectOrderSchema.index({ builderName: 1 });

const ProjectOrderModel = mongoose.model("projectOrder", projectOrderSchema);

module.exports = ProjectOrderModel; 