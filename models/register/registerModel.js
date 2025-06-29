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
  token: {
    type: String,
    default: "",
  },
});
const registerModel = mongoose.model("RegisterData", register_Schema);
module.exports = registerModel;
