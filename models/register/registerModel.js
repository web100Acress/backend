const mongoose = require("mongoose");

const register_Schema = new mongoose.Schema({
  name: {
    type: String,
    required: function() { return !this.googleId; },
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: function() { return !this.googleId; },
    minlength: 8, // Minimum password length
    match: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/, // Password pattern
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  mobile: {
    type: String,
    required: function() { return !this.googleId; },
  },
  role: {
    type: String,
    default: "user",
  },
  // Optional profile image URL (served from /uploads or external storage)
  avatarUrl: {
    type: String,
    default: "",
  },
  token: {
    type: String,
    default: "",
  },
});
const registerModel = mongoose.model("RegisterData", register_Schema);
module.exports = registerModel;
