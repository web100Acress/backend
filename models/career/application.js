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
    matchScore: { type: Number, min: 0, max: 1, required: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Application", applicationSchema);
