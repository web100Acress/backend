const mongoose = require("mongoose");

const userFollowupSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "postPerson", // assuming your user collection name is postPerson
      required: true,
    },
    discussionWith: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    nextFollowupDate: {
      type: String, // or Date if you prefer
      trim: true,
    },
    createdBy: {
      type: String, // admin email or name
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserFollowup", userFollowupSchema);
