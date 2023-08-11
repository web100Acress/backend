
const mongoose = require('mongoose');
// const dotenv = require('dotenv').config()

const connectDb=()=>{

   return mongoose.connect("mongodb://localhost:27017/100_Acre")
  .then(() =>{
    console.log('Connected!')
  })
  .catch((error)=>{
    console.log('error!')
  });
}

module.exports=connectDb