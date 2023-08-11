const mongoose=require('mongoose')

const contactPagedetail=new mongoose.Schema({

    companyName:{
        type:String,
        required:true,
    },

    contactNumber:{
        type:String,
        required:true,
    },
    telephonenumber:{
        type:String,
        required:true,
    },
    
    email:{
        type:String,
        required:true,
    },
    
  address:{
        type:String,
        required:true,
    },

   descripation:{
        type:String,
        required:true,
    },
    
    
})
const contactPagedetailModel=mongoose.model('contactPage_Companydetail',contactPagedetail)
module.exports=contactPagedetailModel
