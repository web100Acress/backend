const mongoose = require("mongoose");

const STAGES = [
  "interview1", // attempt 1
  "hrDiscussion", // attempt 2
  "documentation", // attempt 3
  "success" // completed
];

const onboardingSchema = new mongoose.Schema(
  {
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true },
    openingId: { type: mongoose.Schema.Types.ObjectId, ref: "Opening", required: true },
    candidateName: { type: String, required: true },
    candidateEmail: { type: String, required: true },
    currentStageIndex: { type: Number, default: 0 },
    stages: { type: [String], default: STAGES },
    status: { type: String, enum: ["in_progress", "completed"], default: "in_progress" },
    joiningDate: { type: Date },
    history: [
      {
        stage: String,
        movedAt: { type: Date, default: Date.now },
        note: String,
      },
    ],
  },
  { timestamps: true }
);

onboardingSchema.methods.getProgress = function () {
  const total = this.stages.length;
  const idx = Math.min(this.currentStageIndex, total - 1);
  const completed = this.status === "completed" ? total : idx;
  return { completed, total };
};

module.exports = mongoose.model("Onboarding", onboardingSchema);
