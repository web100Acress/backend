const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    blog_Image: {
        public_id: {
            type: String,
           
        },
        url: {
            type: String,  
        }
    },
    blog_Title: {
        type: String,
      
    },
    blog_Description: {
        type: String,
     
    },
    author:{
        type: String,
     
    },
    blog_Category:{
        type: String,
     
    }
    // Using the csdkccn subdocument schema as an array in the main schema
});

const blogModel = mongoose.model('Blog', blogSchema);

module.exports = blogModel;
