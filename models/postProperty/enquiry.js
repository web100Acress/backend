const mongoose = require("mongoose");

const postEnquiry_Schema = new mongoose.Schema(
  {
    agentEmail: {
      type: String,
    },
    agentNumber: {
      type: String,
    },
    custName: {
      type: String,
    },
    custEmail: {
      type: String,
    },
    custNumber: {
      type: String,
    },
    propertyAddress: {
      type: String,
    },
    status: {
      type: String,
      default: "Pending",
    },
  },
  { timestamps: true },
);

const postEnquiryModel = mongoose.model(
  "PostPropertySchema",
  postEnquiry_Schema,
);
module.exports = postEnquiryModel;
