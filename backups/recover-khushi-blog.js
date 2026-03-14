
const mongoose = require('mongoose');
const blogModel = require('./models/blog/blogpost');

async function recoverBlog(blogId) {
  try {
    await mongoose.connect('mongodb+srv://amit100acre:Amit123@cluster0.ffg8qyf.mongodb.net/?retryWrites=true&w=majority');
    
    const backupData = require('.//Users/100acress.com/Desktop/100acress/100acress.com/backend/backups/khushi-singh-blogs-backup-2026-03-13.json');
    const blogToRecover = backupData.blogs.find(b => b.id === blogId);
    
    if (!blogToRecover) {
      console.log('❌ Blog not found in backup');
      return;
    }
    
    // Recreate the blog
    const newBlog = new blogModel({
      blog_Title: blogToRecover.title,
      blog_Content: blogToRecover.content,
      author: blogToRecover.author,
      customUrlId: blogToRecover.slug,
      isPublished: blogToRecover.isPublished,
      metaTitle: blogToRecover.metaTitle,
      metaDescription: blogToRecover.metaDescription,
      categories: blogToRecover.categories,
      tags: blogToRecover.tags,
      blog_Image: blogToRecover.blog_Image,
      frontImagePreview: blogToRecover.frontImagePreview,
      createdAt: blogToRecover.createdAt,
      updatedAt: new Date()
    });
    
    const savedBlog = await newBlog.save();
    console.log('✅ Blog recovered successfully:', savedBlog._id);
    
  } catch (error) {
    console.error('❌ Recovery error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Usage: recoverBlog('YOUR_BLOG_ID_HERE')
module.exports = { recoverBlog };
