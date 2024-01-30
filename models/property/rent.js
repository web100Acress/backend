const mongoose=require('mongoose')

const rent_Schema=new mongoose.Schema({
    frontImage:{
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    },
    otherImage:[

    ],
    propertyType:{
        type:String,
        required:true
    },
  propertyName:{
    type:String,
    required:true
  },
  city:{
    type:String,
     required:true
  },
  state:{
    type:String,
    required:true
  },
  address:{
    type:String,
    required:true
  },
  price:{
    type:String,
    required:true
  },
  area:{
    type:String,
    required:true
  },
  availableDate:{
    type:String,
    required:true
  },
  descripation:{
    type:String,
    required:true
  },
  furnishing:{
    type:String,
    required:true
  },
  builtYear:{
    type:String,
    required:true
  },
  amenities:[
    {
        type:String,
        required:true
    }
  ],
  landmark:{
    type:String,
    required:true
  },
type:{
  type:String,
  required:true
}

},
{timestamps:true}
)
const rent_Model=mongoose.model('rent_Property',rent_Schema)
module.exports=rent_Model