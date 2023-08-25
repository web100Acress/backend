const mongoose = require('mongoose')

const about_Schema = new mongoose.Schema({
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
    sliderHeading: {
        type: String,
        // required:true
    },
    sliderDescripation: {
        type: String,
        // required:true
    },

    aboutImage: {
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    },
    aboutHeading: {
        type: String,
        // required:true
    },
    aboutDescripation: {
        type: String,
        // required:true
    },

    chooseImage: {
        public_id: {
            type: String,
            // required: true
        },
        url: {
            type: String,
            // required: true
        }
    },
    chooseHeading: {
        type: String,
        required: true
    },
    chooseDescripation: {
        type: String,
        required: true
    },



})
const aboutModel = mongoose.model('AboutPage', about_Schema)
module.exports = aboutModel