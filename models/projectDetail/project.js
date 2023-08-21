const mongoose = require('mongoose')
const projectSchema = new mongoose.Schema({
    sliderImage: {
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    },
    sitePlan: {
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    },
    Image2: {
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    },
    projectName: {
        type: String,
        required: true
    },
    minPrice: {
        type: String,
        required: true
    },
    maxPrice: {
        type: String,
        required: true
    },
    developerName: {
        type: String,
        required: true
    },
    bedroom: [{
        type: String,
        required: true
    }],
    address: {
        type: String,
        required: true
    },
    state:
        {
            type: String,
            required: true
        },
    
    block: {
        type: String,
        required: true
    },
    floor: {
        type: String,
        required: true
    },
    carparkSpace: {
        type: String,
        required: true
    },
    nearestLandmark:{
        type:String,
        required:true
    },
    propertyType: {
        type: String,
        required: true
    },
    aboutProject: {
        type: String,
        required: true
    },
    facility: [
        {
            type: String,
            required: true
        }
    ],
    unit:{
        type:String,
        required:true
    },
    launch:{
        type:String,
        required:true
    },
    area:{
        type:String,
        required:true
    }

},

    {
        timestamps: true
    }

)

const ProjectModel = mongoose.model("projectData", projectSchema)
module.exports = ProjectModel