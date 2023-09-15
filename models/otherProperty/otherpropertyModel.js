const mongoose=require('mongoose')

const otherProperty_Schema= new mongoose.Schema({

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
        


})
const otherPeopertyModel=mongoose.model('OtherProperty',otherProperty_Schema)
module.exports=otherPeopertyModel