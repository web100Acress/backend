const mongoose = require("mongoose");

const siteSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: String, default: "" },
    updatedBy: { type: String }, // store admin id/email if available
  },
  { timestamps: true }
);

module.exports = mongoose.model("SiteSetting", siteSettingSchema);
