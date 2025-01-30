const mongoose = require("mongoose");

// Define the schema
const sessionSchema = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now,
    index: { expires: "1h" },
    // TTL index to expire documents 1 hour after their creation
  },
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
});
// Create the model
const Email_verify = mongoose.model("verifyEmail", sessionSchema);
module.exports = Email_verify;
