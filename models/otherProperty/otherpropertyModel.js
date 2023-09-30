const mongoose = require('mongoose')

const otherProperty_Schema = new mongoose.Schema({

    propertyOwnerEmail: {
        type: String,
        required: true
    },
    propertyOwnerNumber: {
        type: String,
        required: true
    },
    frontImage: {
        public_id: {
            type: String,
        },
        url: {
            type: String,
        }
    },
    otherImage: [

    ],
    propertyType: {
        type: String // means for resident home,bunglow,apartment ,or for commercial like warehouse,
    },
    propertyName: {
        type: String
    },
    price: {
        type: String
    },
    area: {
        type: String
    },
    availableDate: {
        type: String
    },
    descripation: {
        type: String
    },
    furnishing: {
        type: String
    },
    builtYear: {
        Type: String
    },
    amenities: [
        {
            type: String,

        }
    ],
    landMark: {
        type: String
    },
    type: {
        type: String
    },//resident or commercialre
    city: {
        type: String
    },
    state: {
        type: String
    },
    address: {
        type: String
    },
})
const otherPropertyModel = mongoose.model('OtherProperty', otherProperty_Schema)
module.exports = otherPropertyModel