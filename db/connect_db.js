
const mongoose = require('mongoose');
const dotenv = require('dotenv').config()

const connectDb=()=>{

  //  return mongoose.connect("mongodb://localhost:27017/100_Acr~e")
  // return mongoose.connect("mongodb://127.0.0.1:27017/100_Acre")
  
  return mongoose.connect("mongodb+srv://amit100acre:Amit123@cluster0.ffg8qyf.mongodb.net/?retryWrites=true&w=majority")
  .then(() =>{
    console.log('Connected!')
  })
  .catch((error)=>{
    console.log(error)
  });
}

module.exports=connectDb