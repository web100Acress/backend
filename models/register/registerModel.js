const mongoose = require("mongoose");

const register_Schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    rquired: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 8, // Minimum password length
    match: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/, // Password pattern
  },
  mobile: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: "user",
  },
  authorized: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    default: "unauthorized",
  },
  // Optional profile image URL (served from /uploads or external storage)
  avatarUrl: {
    type: String,
    default: "",
  },
  // Array of liked project ids
  favorites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "projectData",
    },
  ],
  token: {
    type: String,
    default: "",
  },
});
const registerModel = mongoose.model("postproperties", register_Schema);
module.exports = registerModel;