const mongoose=require('mongoose')

const websiteSchema=new mongoose.Schema({
    name:{
        type:String
    },
    email:{
        type:String,
        
    },
    number:{
        type:String,
        required:true
    },
    projectName:{
        type:String,
  
    },
    projectAddress:{
        type:String,
       
    },
    status:{
        type: String,
        default:"Pending"
      }
    

},{timestamps:true})
const LeadModel=mongoose.model("websiteLead",websiteSchema);
module.exports=LeadModel