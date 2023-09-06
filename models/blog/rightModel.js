const mongoose=require('mongoose')

const RightsSchema=new mongoose.Schema({
staff_id:[{
     type:mongoose.Schema.Types.ObjectId,
     ref:'Staff'
}],

right:{
    type:String
}
},{
    timestamps:true
});
const RightModel = mongoose.model('Right', RightsSchema);
module.exports = RightModel