const mongoose=require('mongoose')

const otherEnquiry_Schema= new mongoose.Schema({
    sellerEmail:{
        type:String
    },
    SellermobileNumber:{
        type:String
    },
    cust_Name:{
        type:String,
        required:true
    },
    cust_Email:{
        type:String,
        required:true
    },
    cust_Number:{
        type:String,
        required:true
    },
    Prop_address:{
        type:String
    },
    propertyName:{
        type:String
    }

})
const otherEnquiryModel=mongoose.model("otherPropertyEnquiry",otherEnquiry_Schema)
module.exports=otherEnquiryModel