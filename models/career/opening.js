const mongoose = require("mongoose");

const openSchema = new mongoose.Schema({
  jobLocation: {
    type: String,
  },
  jobTitle: {
    type: String,
  },
  status: {
    type: String,
    enum: ["open", "closed"],
    default: "open",
  },
  responsibility: {
    type: String,
  },
  experience: {
    type: String,
  },
  skill: {
    type: String,
  },
  jobProfile: {
    type: String,
  },
}, { timestamps: true });
const openModal = mongoose.model("Opening", openSchema);
module.exports = openModal;
