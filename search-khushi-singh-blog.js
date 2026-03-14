const mongoose = require('mongoose');
require('dotenv').config();

// Import blog model
const blogModel = require('./models/blog/blogpost');

async function searchKhushiSinghBlog() {
  try {
    // Connect to database using the same connection as the running server
    await mongoose.connect('mongodb+srv://amit100acre:Amit123@cluster0.ffg8qyf.mongodb.net/?retryWrites=true&w=majority');
    console.log('✅ Connected to MongoDB');

    // Search for blogs containing "Khushi Singh" in any field
    const searchTerms = ['Khushi Singh', 'khushi singh', 'Khushi', 'khushi'];
    
    for (const term of searchTerms) {
      console.log(`\n🔍 Searching for blogs containing: "${term}"`);
      
      const blogs = await blogModel.find({
        $or: [
          { blog_Title: { $regex: term, $options: 'i' } },
          { blog_Content: { $regex: term, $options: 'i' } },
          { metaTitle: { $regex: term, $options: 'i' } },
          { metaDescription: { $regex: term, $options: 'i' } },
          { author: { $regex: term, $options: 'i' } },
          { categories: { $regex: term, $options: 'i' } }
        ]
      });

      if (blogs.length > 0) {
        console.log(`✅ Found ${blogs.length} blog(s):`);
        blogs.forEach((blog, index) => {
          console.log(`\n${index + 1}. Blog ID: ${blog._id}`);
          console.log(`   Title: ${blog.blog_Title}`);
          console.log(`   Author: ${blog.author || 'Not specified'}`);
          console.log(`   Created: ${blog.createdAt}`);
          console.log(`   Published: ${blog.isPublished ? 'Yes' : 'No'}`);
        });
      } else {
        console.log(`❌ No blogs found containing: "${term}"`);
      }
    }

    // Check all recent blogs (last 30 days) to see if any might be related
    console.log('\n🔍 Checking recent blogs (last 30 days)...');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentBlogs = await blogModel.find({
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: -1 });

    console.log(`📊 Found ${recentBlogs.length} recent blogs:`);
    recentBlogs.forEach((blog, index) => {
      console.log(`\n${index + 1}. Blog ID: ${blog._id}`);
      console.log(`   Title: ${blog.blog_Title}`);
      console.log(`   Author: ${blog.author || 'Not specified'}`);
      console.log(`   Created: ${blog.createdAt}`);
      console.log(`   Published: ${blog.isPublished ? 'Yes' : 'No'}`);
    });

    // Check if there's a backup collection or soft delete mechanism
    console.log('\n🔍 Checking for backup collections...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    const backupCollections = collections.filter(col => 
      col.name.includes('backup') || 
      col.name.includes('deleted') || 
      col.name.includes('archive')
    );

    if (backupCollections.length > 0) {
      console.log('📦 Found backup collections:');
      backupCollections.forEach(col => {
        console.log(`   - ${col.name}`);
      });
    } else {
      console.log('❌ No backup collections found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the search
searchKhushiSinghBlog();
