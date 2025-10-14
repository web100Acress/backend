const mongoose = require("mongoose");

const STAGES = [
  "interview1", // attempt 1
  "hrDiscussion", // attempt 2
  "documentation", // attempt 3
  "success" // completed
];

const stageInviteSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["online", "offline"], required: true },
    tasks: [{ title: String, description: String, dueAt: Date }],
    scheduledAt: { type: Date },
    endsAt: { type: Date },
    meetingLink: { type: String },
    location: { type: String },
    content: { type: String },
    sentAt: { type: Date },
  },
  { _id: false }
);

const stageStatusSchema = new mongoose.Schema(
  {
    invite: stageInviteSchema,
    feedback: { type: String },
    completedAt: { type: Date },
    status: { type: String, enum: ["pending", "invited", "completed"], default: "pending" },
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    docType: { type: String, required: true },
    url: { type: String },
    status: { type: String, enum: ["pending", "uploaded", "verified", "rejected"], default: "pending" },
    uploadedAt: { type: Date },
    verifiedAt: { type: Date },
    notes: { type: String },
  },
  { _id: true, timestamps: false }
);

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
    stageData: {
      interview1: stageStatusSchema,
      hrDiscussion: stageStatusSchema,
      documentation: stageStatusSchema,
    },
    documents: [documentSchema],
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
