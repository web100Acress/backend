const mongoose = require("mongoose");

const enquiry_Schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    mobile: {
      type: String,
      required: true,
    },
    query: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: "Pending",
    },
    source: {
      type: String,
      default: "DarkCTA Form",
    },
  },
  { timestamps: true },
);

const enquiryModel = mongoose.model("Enquiry", enquiry_Schema);
module.exports = enquiryModel;
