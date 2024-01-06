const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    blogImage: {
        public_id: {
            type: String,
        },
        url: {
            type: String,
        },
    },
    title: {
        type: String,
    },
    descripation: {
        type: String,
    }
});

const blogSchema = new mongoose.Schema({
    sliderImage: {
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    },
    title: {
        type: String,
        required: true
    },
    descripation: {
        type: String,
        required: true
    },
    blog: [postSchema] // Using the subdocument schema as an array in the main schema
});

const BlogModel = mongoose.model('Blog', blogSchema);

module.exports = BlogModel;
