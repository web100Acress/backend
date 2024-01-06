const mongoose = require('mongoose');


const UserSchema=new mongoose.Schema({
    name:{
      type:String,
    
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
       
      },
      address:{
        type:String,
        required:true
      }
    
},{timestamps:true})

const UserModel=mongoose.model("userEnquiry_Project", UserSchema)

module.exports=UserModel