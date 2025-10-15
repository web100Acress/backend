const mongoose = require("mongoose");

const OFFBOARDING_STAGES = [
  "exitInterview",
  "assetReturn",
  "documentation",
  "finalSettlement",
  "success"
];

const documentSchema = new mongoose.Schema(
  {
    docType: { type: String, required: true },
    url: { type: String, required: true },
    recordedAt: { type: Date, default: Date.now },
  },
  { _id: true, timestamps: false }
);

const offboardingSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Onboarding", required: true },
    employeeName: { type: String, required: true },
    employeeEmail: { type: String, required: true },
    stages: { type: [String], default: OFFBOARDING_STAGES },
    currentStageIndex: { type: Number, default: 0 },
    status: { type: String, enum: ["pending", "in_progress", "completed"], default: "pending" },
    lastWorkingDate: { type: Date },
    documents: [documentSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Offboarding", offboardingSchema);
