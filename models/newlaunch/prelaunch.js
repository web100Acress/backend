const mongoose=require('mongoose')

const preLaunch_Schema= new mongoose.Schema({
    projectName: {
        type:String,
      
    },
    price:{
        type:String,
    
    },
    city:{
      
        type:String,
    }, 
    configuration:{
        type:String,
    },
    status:{
        type:String,

    },
    featured:{
        type:String
      
    },
    rera_No:{
        type:String
      
    },
    minCovered_Area:{
        type:String
      
    },
    maxCovered_Area:{
    type:String
        
    },
    aboutProject:{
        type:String,
       
    },
    builderName:{
        type:String,
       
    },
    BHK_details:[
        {
        input_Bhk:{
            type:String
        },
        build_area:{
            type:String
        },
        possession:{
            type:String
        },
        image:{
            public_id: {
                type: String,
               
            },
            url: {
                type: String,
             
            }
        },

    }
    ],
    photo:[],
    amentites:[
        {
            type: String,

        }
    ],
    location:{
        type: String,
        
    },
    floorPlan:{
        public_id: {
            type: String,
            
        },
        url: {
            type: String,

        }
    },
    sitePlan:{
        public_id: {
            type: String,
            
        },
        url: {
            type: String,

        }
    },
    locationMap:{
        public_id: {
            type: String,
            
        },
        url: {
            type: String,

        }
    }

})
const prelaunchModel=mongoose.model('preLunach',preLaunch_Schema)
module.exports=prelaunchModel