
const mongoose = require('mongoose');
const dotenv = require('dotenv').config()

const connectDb=()=>{

   return mongoose.connect(process.env.DB_URL)

  // return mongoose.connect("mongodb+srv://web100acress:Amit100@cluster0.lcaufzm.mongodb.net/")


    // return mongoose.connect("mongodb+srv://Amit:Amit123@cluster0.7jljtxl.mongodb.net/")
  return mongoose.connect("mongodb+srv://amit100acre:Amit123@cluster0.ffg8qyf.mongodb.net/?retryWrites=true&w=majority")
  .then(() =>{
    console.log('Connected!')
  })
  .catch((error)=>{
    console.log(error)
  });
}

module.exports=connectDb
