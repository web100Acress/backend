const mongoose=require('mongoose')

const contactPagedetail=new mongoose.Schema({
    contact_banner:{
        public_id:{
            type:String,
            required:true
        },
        url:{
            type:String,
            required:true
        }
    },

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
    heading:{
        type:String,
        required:true, 
    },
    detail:{
        type:String,
        required:true,
    }
    
    
})
const contactPagedetailModel=mongoose.model('contactPage_Companydetail',contactPagedetail)
module.exports=contactPagedetailModel
