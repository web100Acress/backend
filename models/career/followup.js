const mongoose = require("mongoose");

const followupSchema = new mongoose.Schema(
  {
    applicationId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Application", 
      required: true 
    },
    notes: { 
      type: String, 
      required: true 
    },
    date: { 
      type: Date, 
      default: Date.now 
    },
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Followup", followupSchema);
