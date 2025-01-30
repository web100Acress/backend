const mongoose = require("mongoose");

const contact_Schema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
    },
    mobile: {
      type: String,
      required: true,
    },
    message: {
      type: String,
    },
    status: {
      type: String,
      default: "Pending",
    },
  },
  { timestamps: true },
);

const contactModel = mongoose.model("customerContact", contact_Schema);
module.exports = contactModel;
