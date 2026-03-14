const mongoose = require('mongoose');
const fs = require('fs');

// Import blog model
const blogModel = require('./models/blog/blogpost');

async function restoreBlogAgain() {
  try {
    // Connect to database
    await mongoose.connect('mongodb+srv://amit100acre:Amit123@cluster0.ffg8qyf.mongodb.net/?retryWrites=true&w=majority');
    console.log('✅ Connected to MongoDB');

    // Read the recovered blog content
    const blogContent = fs.readFileSync('/Users/100acress.com/Desktop/100acress/100acress.com/100acressFront/RECOVERED_GRIH_PRAVESH_BLOG.md', 'utf8');

    const blogId = '69b27339f73879f9b4c5659d';
    
    console.log(`🔄 Restoring content to blog ID: ${blogId}`);
    console.log(`📄 Content length from file: ${blogContent.length} characters`);
    
    // Update the blog directly with findByIdAndUpdate
    const updatedBlog = await blogModel.findByIdAndUpdate(
      blogId,
      {
        blog_Content: blogContent,
        metaTitle: 'Grih Pravesh Muhurat 2026: Auspicious Dates for Your New Home',
        metaDescription: 'Complete guide to Grih Pravesh muhurat dates in 2026. Find auspicious dates for housewarming ceremony, rituals, Vastu tips, and essential preparations.',
        categories: 'Vastu & Astrology',
        tags: 'Grih Pravesh, Muhurat, Vastu, Housewarming, 2026, Auspicious Dates',
        updatedAt: new Date()
      },
      { new: true } // Return the updated document
    );
    
    if (updatedBlog) {
      console.log('✅ BLOG UPDATED SUCCESSFULLY!');
      console.log(`   Title: ${updatedBlog.blog_Title}`);
      console.log(`   Author: ${updatedBlog.author}`);
      console.log(`   Content Length: ${updatedBlog.blog_Content ? updatedBlog.blog_Content.length : 0}`);
      console.log(`   Published: ${updatedBlog.isPublished ? 'Yes' : 'No'}`);
      console.log(`   Updated: ${updatedBlog.updatedAt}`);
      
      if (updatedBlog.blog_Content) {
        console.log('\n📝 First 200 characters of content:');
        console.log(updatedBlog.blog_Content.substring(0, 200) + '...');
      }
    } else {
      console.log('❌ Blog update failed');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the restoration
restoreBlogAgain();
