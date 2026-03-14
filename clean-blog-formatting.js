const mongoose = require('mongoose');
const fs = require('fs');

// Import blog model
const blogModel = require('./models/blog/blogpost');

async function cleanBlogFormatting() {
  try {
    // Connect to database
    await mongoose.connect('mongodb+srv://amit100acre:Amit123@cluster0.ffg8qyf.mongodb.net/?retryWrites=true&w=majority');
    console.log('✅ Connected to MongoDB');

    // Read the original markdown content
    const markdownContent = fs.readFileSync('/Users/100acress.com/Desktop/100acress/100acress.com/100acressFront/RECOVERED_GRIH_PRAVESH_BLOG.md', 'utf8');

    const blogId = '69b27339f73879f9b4c5659d';
    
    console.log(`🔄 Cleaning formatting for blog ID: ${blogId}`);
    
    // Convert markdown to clean HTML
    let htmlContent = markdownContent
      // Headers
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      // Bold text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic text
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Line breaks (convert double line breaks to paragraph breaks)
      .replace(/\n\n/g, '</p><p>')
      // Lists (bullet points)
      .replace(/^\* (.+)$/gm, '<li>$1</li>')
      // Numbered lists
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
      // Horizontal rules
      .replace(/^---$/gm, '<hr>')
      // Clean up list formatting
      .replace(/<\/li><p><li>/g, '</li><li>')
      .replace(/<\/li><\/p><li>/g, '</li><li>')
      // Wrap consecutive list items in ul tags
      .replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>')
      .replace(/<\/ul><ul>/g, '')
      // Fix paragraph tags around block elements
      .replace(/<p><h([1-6])>/g, '<h$1>')
      .replace(/<\/h([1-6])><\/p>/g, '</h$1>')
      .replace(/<p><ul>/g, '<ul>')
      .replace(/<\/ul><\/p>/g, '</ul>')
      .replace(/<p><hr><\/p>/g, '<hr>')
      // Add paragraph tags at the beginning and end
      .replace(/^/, '<p>')
      .replace(/$/, '</p>')
      // Clean up any empty paragraphs
      .replace(/<p><\/p>/g, '')
      .replace(/<p>\s*<\/p>/g, '')
      // Clean up any double tags
      .replace(/<p><p>/g, '<p>')
      .replace(/<\/p><\/p>/g, '</p>');

    // Update the blog with clean HTML
    const updatedBlog = await blogModel.findByIdAndUpdate(
      blogId,
      {
        blog_Description: htmlContent,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (updatedBlog) {
      console.log('✅ BLOG FORMATTING CLEANED!');
      console.log(`   Title: ${updatedBlog.blog_Title}`);
      console.log(`   Content Length: ${updatedBlog.blog_Description.length} characters`);
      console.log(`   Published: ${updatedBlog.isPublished ? 'Yes' : 'No'}`);
      
      console.log('\n📝 Clean content preview:');
      console.log(updatedBlog.blog_Description.substring(0, 600) + '...');
      
      console.log('\n🌐 Blog should now display properly at:');
      console.log(`   https://www.100acress.com/blog/${updatedBlog.slug}/`);
      
      console.log('\n💡 The content is now in proper HTML format and should render correctly!');
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

// Run the formatting cleanup
cleanBlogFormatting();
