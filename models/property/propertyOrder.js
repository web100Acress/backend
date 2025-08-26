const mongoose = require("mongoose");

const propertyOrderSchema = new mongoose.Schema(
  {
    builderName: {
      type: String,
      required: true,
      unique: true,
    },
    customOrder: {
      type: [String], // Array of property IDs in custom order
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

propertyOrderSchema.index({ builderName: 1 });

const PropertyOrderModel = mongoose.model("propertyOrder", propertyOrderSchema);

module.exports = PropertyOrderModel;
