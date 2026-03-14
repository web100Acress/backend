const mongoose = require('mongoose');
const fs = require('fs');

// Import blog model
const blogModel = require('./models/blog/blogpost');

async function fixBlogFormatting() {
  try {
    // Connect to database
    await mongoose.connect('mongodb+srv://amit100acre:Amit123@cluster0.ffg8qyf.mongodb.net/?retryWrites=true&w=majority');
    console.log('✅ Connected to MongoDB');

    // Read the original markdown content
    const markdownContent = fs.readFileSync('/Users/100acress.com/Desktop/100acress/100acress.com/100acressFront/RECOVERED_GRIH_PRAVESH_BLOG.md', 'utf8');

    const blogId = '69b27339f73879f9b4c5659d';
    
    console.log(`🔄 Fixing formatting for blog ID: ${blogId}`);
    
    // Convert markdown to proper HTML
    let htmlContent = markdownContent
      // Headers
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      // Bold text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Line breaks
      .replace(/\n\n/g, '</p><p>')
      // Lists
      .replace(/^\* (.+)$/gm, '<li>$1</li>')
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
      // Horizontal rules
      .replace(/^---$/gm, '<hr>')
      // Combine consecutive list items
      .replace(/<\/li><p><li>/g, '</li><li>')
      .replace(/<\/li><\/p><li>/g, '</li><li>')
      // Fix paragraph tags around headers
      .replace(/<p><h([1-6])>/g, '<h$1>')
      .replace(/<\/h([1-6])><\/p>/g, '</h$1>')
      // Fix paragraph tags around lists and hr
      .replace(/<p><ul>/g, '<ul>')
      .replace(/<\/ul><\/p>/g, '</ul>')
      .replace(/<p><hr><\/p>/g, '<hr>')
      // Add paragraph tags at the beginning and end
      .replace(/^/, '<p>')
      .replace(/$/, '</p>')
      // Clean up double tags
      .replace(/<p><\/p>/g, '')
      .replace(/<ul><\/ul>/g, '');

    // Add some styling for better readability
    htmlContent = `
    <div class="blog-content">
      ${htmlContent}
      <style>
        .blog-content { line-height: 1.6; color: #333; }
        .blog-content h1 { color: #2c3e50; margin: 20px 0 10px 0; font-size: 2em; }
        .blog-content h2 { color: #34495e; margin: 15px 0 8px 0; font-size: 1.5em; }
        .blog-content h3 { color: #7f8c8d; margin: 10px 0 5px 0; font-size: 1.2em; }
        .blog-content p { margin: 10px 0; }
        .blog-content ul { margin: 10px 0; padding-left: 20px; }
        .blog-content li { margin: 5px 0; }
        .blog-content hr { border: none; border-top: 1px solid #eee; margin: 20px 0; }
        .blog-content strong { color: #2c3e50; }
      </style>
    </div>
    `;

    // Update the blog with properly formatted HTML
    const updatedBlog = await blogModel.findByIdAndUpdate(
      blogId,
      {
        blog_Description: htmlContent,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (updatedBlog) {
      console.log('✅ BLOG FORMATTING FIXED!');
      console.log(`   Title: ${updatedBlog.blog_Title}`);
      console.log(`   Content Length: ${updatedBlog.blog_Description.length} characters`);
      console.log(`   Published: ${updatedBlog.isPublished ? 'Yes' : 'No'}`);
      
      console.log('\n📝 Formatted content preview:');
      console.log(updatedBlog.blog_Description.substring(0, 800) + '...');
      
      console.log('\n🌐 Blog should now display properly at:');
      console.log(`   https://www.100acress.com/blog/${updatedBlog.slug}/`);
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

// Run the formatting fix
fixBlogFormatting();
