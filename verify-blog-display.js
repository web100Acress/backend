const mongoose = require('mongoose');

// Import blog model
const blogModel = require('./models/blog/blogpost');

async function verifyBlogDisplay() {
  try {
    // Connect to database
    await mongoose.connect('mongodb+srv://amit100acre:Amit123@cluster0.ffg8qyf.mongodb.net/?retryWrites=true&w=majority');
    console.log('✅ Connected to MongoDB');

    const blogId = '69b27339f73879f9b4c5659d';
    
    console.log(`🔍 Verifying blog display for ID: ${blogId}`);
    
    const blog = await blogModel.findById(blogId);
    
    if (blog) {
      console.log('✅ BLOG VERIFICATION COMPLETE:');
      console.log(`   Title: ${blog.blog_Title}`);
      console.log(`   Author: ${blog.author}`);
      console.log(`   Published: ${blog.isPublished ? 'Yes' : 'No'}`);
      console.log(`   Content Length: ${blog.blog_Description ? blog.blog_Description.length : 0}`);
      console.log(`   Slug: ${blog.slug}`);
      console.log(`   Updated: ${blog.updatedAt}`);
      
      if (blog.blog_Description) {
        // Check if content has HTML tags
        const hasHTML = /<[^>]+>/.test(blog.blog_Description);
        console.log(`   Has HTML Formatting: ${hasHTML ? 'Yes' : 'No'}`);
        
        // Count different HTML elements
        const h1Count = (blog.blog_Description.match(/<h1>/g) || []).length;
        const h2Count = (blog.blog_Description.match(/<h2>/g) || []).length;
        const h3Count = (blog.blog_Description.match(/<h3>/g) || []).length;
        const pCount = (blog.blog_Description.match(/<p>/g) || []).length;
        const ulCount = (blog.blog_Description.match(/<ul>/g) || []).length;
        
        console.log(`   HTML Elements: ${h1Count} H1, ${h2Count} H2, ${h3Count} H3, ${pCount} paragraphs, ${ulCount} lists`);
        
        console.log('\n📝 Content structure preview:');
        const preview = blog.blog_Description
          .replace(/<[^>]+>/g, '') // Remove HTML tags for preview
          .substring(0, 300);
        console.log(preview + '...');
      }
      
      console.log('\n🌐 Blog Access Information:');
      console.log(`   URL: https://www.100acress.com/blog/${blog.slug}/`);
      console.log(`   Status: ${blog.isPublished ? 'Published and Live' : 'Draft - Not Public'}`);
      
      if (blog.isPublished) {
        console.log('   ✅ Blog should be visible to all visitors');
      } else {
        console.log('   ⚠️  Blog is in draft mode - not visible to public');
      }
      
    } else {
      console.log('❌ Blog not found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the verification
verifyBlogDisplay();
