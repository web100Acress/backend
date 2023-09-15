const mongoose=require('mongoose')

const blog_Schema=new mongoose.Schema({
    sliderImage:{
        public_id: {
            type: String,
            required:true
        },
        url: {
            type: String,
            required:true
        }
    },
    title:{
        type:String,
        required:true
    },
    descripation:{
        type:String,
        required:true
    },
    blog:[
        {
          blogImage:{
            public_id: {
                type: String,
         
            },
            url: {
                type: String,
             
            },
          },
          title:{
            type:String,           
          },
          descripation:{
            type:String, 
          }

        }
    ]


})
const blogModel=mongoose.model('Blog', blog_Schema)
module.exports=blogModel