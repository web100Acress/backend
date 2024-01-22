const mongoose = require('mongoose');


const UserSchema = new mongoose.Schema({
  name: {
    type: String,

  },
  email: {
    type: String,
   
  },
  mobile: {
    type: String,
    required: true
  },
  projectName: {
    type: String,

  },
  address: {
    type: String,
    required: true
  },
  status:{
    type: String,
    default:"Pending"
  }


}, { timestamps: true })

const UserModel = mongoose.model("userEnquiry_Project", UserSchema)

module.exports = UserModel