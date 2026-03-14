const mongoose = require('mongoose');
const fs = require('fs');

// Import blog model
const blogModel = require('./models/blog/blogpost');

async function restoreGrihPraveshBlog() {
  try {
    // Connect to database
    await mongoose.connect('mongodb+srv://amit100acre:Amit123@cluster0.ffg8qyf.mongodb.net/?retryWrites=true&w=majority');
    console.log('✅ Connected to MongoDB');

    // Read the recovered blog content
    const blogContent = fs.readFileSync('/Users/100acress.com/Desktop/100acress/100acress.com/100acressFront/RECOVERED_GRIH_PRAVESH_BLOG.md', 'utf8');

    // Find the blog that lost its content
    const blogId = '69b27339f73879f9b4c5659d';
    
    console.log(`🔄 Restoring content to blog ID: ${blogId}`);
    
    const blog = await blogModel.findById(blogId);
    
    if (blog) {
      // Convert markdown to HTML-like format for the blog
      const htmlContent = blogContent
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^\*\*(.+)\*\*$/gm, '<strong>$1</strong>')
        .replace(/^\* (.+)$/gm, '<li>$1</li>')
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
        .replace(/^---$/gm, '<hr>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>')
        .replace(/<p><h([1-6])>/g, '<h$1>')
        .replace(/<\/h([1-6])><\/p>/g, '</h$1>')
        .replace(/<p><li>/g, '<ul><li>')
        .replace(/<\/li><\/p>/g, '</li></ul>')
        .replace(/<\/ul><ul>/g, '')
        .replace(/<p><hr><\/p>/g, '<hr>')
        .replace(/<p>\*\*(.+)\*\*<\/p>/g, '<p><strong>$1</strong></p>');

      // Update the blog with restored content
      blog.blog_Content = htmlContent;
      blog.updatedAt = new Date();
      
      // Also update metadata
      blog.metaTitle = 'Grih Pravesh Muhurat 2026: Auspicious Dates for Your New Home';
      blog.metaDescription = 'Complete guide to Grih Pravesh muhurat dates in 2026. Find auspicious dates for housewarming ceremony, rituals, Vastu tips, and essential preparations.';
      blog.categories = 'Vastu & Astrology';
      blog.tags = 'Grih Pravesh, Muhurat, Vastu, Housewarming, 2026, Auspicious Dates';
      
      await blog.save();
      
      console.log('✅ BLOG CONTENT RESTORED SUCCESSFULLY!');
      console.log(`   Title: ${blog.blog_Title}`);
      console.log(`   Author: ${blog.author}`);
      console.log(`   Content Length: ${blog.blog_Content.length} characters`);
      console.log(`   Published: ${blog.isPublished ? 'Yes' : 'No'}`);
      console.log(`   Updated: ${blog.updatedAt}`);
      
      console.log('\n📝 Content Preview:');
      console.log(blog.blog_Content.substring(0, 300) + '...');
      
    } else {
      console.log('❌ Blog not found in database');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the restoration
restoreGrihPraveshBlog();
