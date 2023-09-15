const mongoose=require('mongoose')

const newLaunch_Schema= new mongoose.Schema({
    sliderImage: {
        public_id: {
            type: String,
            
        },
        url: {
            type: String,

        }
    },
    sitePlan: {
        public_id: {
            type: String
        },
        url: {
            type: String,
            
        }
    },
    Image2: {
        public_id: {
            type: String
        },
        url: {
            type: String,
        
        }
    },
    projectName: {
        type: String
    },
    minPrice: {
        type: String
    },
    maxPrice: {
        type: String
    },
    developerName: {
        type: String,
    },
    bedroom: [{
        type: String
    }],
    address: {
        type: String,

    },
    state:
        {
            type: String,
    
        },
    
    block: {
        type: String
    },
    floor: {
        type: String,
        
    },
    carparkSpace: {
        type: String,
       
    },
    nearestLandmark:{
        type:String,
       
    },
    propertyType: {
        type: String,
        
    },
    aboutProject: {
        type: String,
       
    },
    facility: [
        {
            type: String,
        
        }
    ],
    unit:{
        type:String,
       
    },
    launch:{
        type:String,
        
    },
    area:{
        type:String,
        
    }

})
const newlaunchModel=mongoose.model('newLunach',newLaunch_Schema)
module.exports=newlaunchModel