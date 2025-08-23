const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    openingId: { type: mongoose.Schema.Types.ObjectId, ref: "Opening", required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    resumeUrl: { type: String },
    coverLetter: { type: String },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Application", applicationSchema);
