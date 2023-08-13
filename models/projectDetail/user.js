const mongoose = require('mongoose');


const UserSchema=new mongoose.Schema({
    name:{
      type:String,
      required:true
    },
    email:{
        type:String,
        required:true
      },
      mobile:{
        type:String,
        required:true
      },
      projectName:{
        type:String,
        required:true
      },
    
},{timestamps:true})

const UserModel=mongoose.model("userEnquiry_Project", UserSchema)

module.exports=UserModel