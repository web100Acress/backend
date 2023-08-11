const mongoose=require('mongoose')

const contactBanner=new mongoose.Schema({
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
    heading:{
        type:String,
        required:true
    },
    descripation:{
        type:String,
        required:true
    }


},{timestamps:true})
const contactbannerModel=mongoose.model('contactbanner',contactBanner)
module.exports=contactbannerModel