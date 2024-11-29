
const mongoose = require('mongoose');
require('dotenv').config(); 

const connectDb=()=>{

  //  return mongoose.connect("mongodb://localhost:27017/100_Acre")

  // return mongoose.connect("mongodb+srv://web100acress:Amit100@cluster0.lcaufzm.mongodb.net/")


    // return mongoose.connect("mongodb+srv://Amit:Amit123@cluster0.7jljtxl.mongodb.net/")libj/lfb
    // hkrehui
  return  mongoose.connect(process.env.MONGO_URI||"mongodb+srv://amit100acre:Amit123@cluster0.ffg8qyf.mongodb.net/?retryWrites=true&w=majority")
  .then(() =>{
    console.log('db Connected!')
  })
  .catch((error)=>{
    console.log(error)
  });
}

module.exports=connectDb
