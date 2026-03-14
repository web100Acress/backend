const mongoose = require('mongoose');

// Import blog model
const blogModel = require('./models/blog/blogpost');

async function publishBlog() {
  try {
    // Connect to database
    await mongoose.connect('mongodb+srv://amit100acre:Amit123@cluster0.ffg8qyf.mongodb.net/?retryWrites=true&w=majority');
    console.log('✅ Connected to MongoDB');

    const blogId = '69b27339f73879f9b4c5659d';
    
    console.log(`🔄 Publishing blog ID: ${blogId}`);
    
    // Update the blog to publish it
    const updatedBlog = await blogModel.findByIdAndUpdate(
      blogId,
      {
        isPublished: true,
        updatedAt: new Date()
      },
      { new: true } // Return the updated document
    );
    
    if (updatedBlog) {
      console.log('✅ BLOG PUBLISHED SUCCESSFULLY!');
      console.log(`   Title: ${updatedBlog.blog_Title}`);
      console.log(`   Author: ${updatedBlog.author}`);
      console.log(`   Published: ${updatedBlog.isPublished ? 'Yes' : 'No'}`);
      console.log(`   Slug: ${updatedBlog.slug}`);
      console.log(`   Custom URL: ${updatedBlog.customUrlId}`);
      console.log(`   Updated: ${updatedBlog.updatedAt}`);
      
      console.log('\n🌐 Blog should now be accessible at:');
      console.log(`   https://www.100acress.com/blog/${updatedBlog.slug}/`);
      if (updatedBlog.customUrlId) {
        console.log(`   https://www.100acress.com/blog/${updatedBlog.customUrlId}/`);
      }
    } else {
      console.log('❌ Blog publish failed');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the publish
publishBlog();
