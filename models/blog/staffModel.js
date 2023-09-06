const mongoose=require('mongoose')

const StaffSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String
    },
    
},{
    timestamps:true
});
const StaffModel = mongoose.model('Staff', StaffSchema);
module.exports = StaffModel