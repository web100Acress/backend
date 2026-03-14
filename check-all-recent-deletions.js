const mongoose = require('mongoose');

// Import blog model
const blogModel = require('./models/blog/blogpost');

async function checkAllRecentDeletions() {
  try {
    // Connect to database
    await mongoose.connect('mongodb+srv://amit100acre:Amit123@cluster0.ffg8qyf.mongodb.net/?retryWrites=true&w=majority');
    console.log('✅ Connected to MongoDB');

    // Get today's date
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    console.log(`🔍 Checking for any blogs created today that might have been deleted...`);

    // Check all blogs created today (by any author)
    const todayAllBlogs = await blogModel.find({
      createdAt: {
        $gte: todayStart,
        $lt: todayEnd
      }
    }).sort({ createdAt: -1 });

    console.log(`📊 Found ${todayAllBlogs.length} total blogs created today:`);
    
    if (todayAllBlogs.length === 0) {
      console.log('❌ No blogs created today found in database');
    } else {
      todayAllBlogs.forEach((blog, index) => {
        console.log(`\n${index + 1}. ID: ${blog._id}`);
        console.log(`   Title: ${blog.blog_Title}`);
        console.log(`   Author: ${blog.author || 'Not specified'}`);
        console.log(`   Created: ${blog.createdAt}`);
        console.log(`   Published: ${blog.isPublished ? 'Yes' : 'No'}`);
      });
    }

    // Check for any blogs deleted recently by looking at the server logs pattern
    console.log('\n🔍 Checking for blogs with "Khushi Singh" in content that might be affected...');
    
    const khushiContentBlogs = await blogModel.find({
      $or: [
        { blog_Title: { $regex: 'Khushi', $options: 'i' } },
        { blog_Content: { $regex: 'Khushi', $options: 'i' } },
        { metaTitle: { $regex: 'Khushi', $options: 'i' } },
        { metaDescription: { $regex: 'Khushi', $options: 'i' } }
      ]
    });

    console.log(`📊 Found ${khushiContentBlogs.length} blogs mentioning "Khushi":`);
    
    khushiContentBlogs.forEach((blog, index) => {
      console.log(`\n${index + 1}. ID: ${blog._id}`);
      console.log(`   Title: ${blog.blog_Title}`);
      console.log(`   Author: ${blog.author || 'Not specified'}`);
      console.log(`   Created: ${blog.createdAt}`);
      console.log(`   Published: ${blog.isPublished ? 'Yes' : 'No'}`);
    });

    // Let's also check if there are any blogs that were recently updated (might indicate deletion/restore)
    console.log('\n🔍 Checking for recently updated blogs (last 24 hours)...');
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentlyUpdated = await blogModel.find({
      updatedAt: { $gte: yesterday }
    }).sort({ updatedAt: -1 });

    console.log(`📊 Found ${recentlyUpdated.length} recently updated blogs:`);
    
    recentlyUpdated.slice(0, 10).forEach((blog, index) => {
      const isKhushi = blog.author && blog.author.includes('Khushi Singh');
      console.log(`\n${index + 1}. ID: ${blog._id} ${isKhushi ? '👤' : ''}`);
      console.log(`   Title: ${blog.blog_Title}`);
      console.log(`   Author: ${blog.author || 'Not specified'}`);
      console.log(`   Updated: ${blog.updatedAt}`);
      console.log(`   Created: ${blog.createdAt}`);
    });

    // Check if the user might be referring to a specific blog
    console.log('\n💡 POSSIBLE SCENARIOS:');
    console.log('1. Blog was deleted but already restored');
    console.log('2. Blog was deleted by a different author');
    console.log('3. Blog deletion is pending/not yet reflected in database');
    console.log('4. User might be thinking of a draft that was deleted');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the check
checkAllRecentDeletions();
