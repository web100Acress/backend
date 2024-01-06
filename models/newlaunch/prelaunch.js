const mongoose=require('mongoose')

const bhk_Schema=new mongoose.Schema({
    
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
})


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
     bhk_Schema
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
    },
    Aboutdeveloper:{
        type:String
    },
    url:{
        type:String
    },
    meta_title:{
        type:String
    } ,
    meta_description:{
        type:String
    }


},{
    timestamps:true
})
const prelaunchModel=mongoose.model('preLunach',preLaunch_Schema)
module.exports=prelaunchModel




  
 