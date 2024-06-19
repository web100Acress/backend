const mongoose = require('mongoose')

const property_Schema=new mongoose.Schema({
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
                type: String // means for resident home ,or for commercial like warehouse
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
            },//resident or commercial
            city: {
                type: String
            },
            state: {
                type: String
            },
            address: {
                type: String
            },
            email:{
                type:String
            },
            number:{
                type:String
            },
            verify:{
                type:String
            },
            propertyLooking:{
                type:String
            }
        })

const post_Schema =new mongoose.Schema({
    name: {
        type: String,

    },
    email: {
        type: String,
        required: true,
        unique:true
    },
    mobile: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true,
        minlength: 5,
        match: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/
    },
    postProperty: [
        property_Schema
    ],

    role: {
        type: String,
        required: true,
    },
    token: {
        type: String,
        default: ''
    },
   
   
}
)
const postPropertyModel = mongoose.model('postProperty', post_Schema)
module.exports = postPropertyModel



