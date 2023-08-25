
const mongoose = require('mongoose');

const projectBanner_Schema=new mongoose.Schema({
    bannerImage:{
      public_id: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    }
    },
    projectName:{
      type:String,
      required:true
    },
    unit:{
      type:String,
      required:true
    },
    launch:{
      type:String,
      required:true
    },
    descripation:{
        type:String,
        required:true
    }

})
const projectBannerModel=mongoose.model('projectBanner',projectBanner_Schema)
module.exports=projectBannerModel