const mongoose = require('mongoose')

const buyCommercial_Schema = new mongoose.Schema({
    frontImage: {
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    },
    otherImage: [
       
    ],
    projectName: {
        type: String,
        required: true
    },
    propertyTitle: {
        type: String,//here we mention 1bhk or 
        required: true
    },
    address: {
        type: String,
        required: true
    },
    price: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    descripation: {
        type: String,
        required: true
    },
    amenities: [
        {
            type: String,
            required: true
        }
    ],
    type:{
        type:String,
        required:true
    },
    area:{
        type:String,
        required:true
    },


})
const buyCommercial_Model = mongoose.model('BuyCommercial_Property', buyCommercial_Schema)
module.exports = buyCommercial_Model