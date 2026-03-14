const mongoose = require('mongoose');

// Import blog model
const blogModel = require('./models/blog/blogpost');

async function checkBlogStatus() {
  try {
    // Connect to database
    await mongoose.connect('mongodb+srv://amit100acre:Amit123@cluster0.ffg8qyf.mongodb.net/?retryWrites=true&w=majority');
    console.log('✅ Connected to MongoDB');

    const blogId = '69b27339f73879f9b4c5659d';
    
    console.log(`🔍 Checking blog ID: ${blogId}`);
    
    const blog = await blogModel.findById(blogId);
    
    if (blog) {
      console.log('✅ BLOG FOUND:');
      console.log(`   Title: ${blog.blog_Title}`);
      console.log(`   Author: ${blog.author}`);
      console.log(`   Description Length: ${blog.blog_Description ? blog.blog_Description.length : 0}`);
      console.log(`   Has Content: ${blog.blog_Description ? 'Yes' : 'No'}`);
      console.log(`   Published: ${blog.isPublished ? 'Yes' : 'No'}`);
      console.log(`   Created: ${blog.createdAt}`);
      console.log(`   Updated: ${blog.updatedAt}`);
      
      if (blog.blog_Description) {
        console.log('\n📝 First 500 characters of content:');
        console.log(blog.blog_Description.substring(0, 500));
        console.log('...');
      } else {
        console.log('\n❌ NO CONTENT FOUND - Need to restore again');
      }
    } else {
      console.log('❌ BLOG NOT FOUND');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the check
checkBlogStatus();
