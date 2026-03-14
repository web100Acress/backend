const mongoose = require('mongoose');

// Import blog model
const blogModel = require('./models/blog/blogpost');

async function checkSpecificBlog() {
  try {
    // Connect to database
    await mongoose.connect('mongodb+srv://amit100acre:Amit123@cluster0.ffg8qyf.mongodb.net/?retryWrites=true&w=majority');
    console.log('✅ Connected to MongoDB');

    // Check the specific blog that was updated today
    const blogId = '69b27339f73879f9b4c5659d';
    
    console.log(`🔍 Checking blog ID: ${blogId}`);
    
    const blog = await blogModel.findById(blogId);
    
    if (blog) {
      console.log('✅ BLOG FOUND IN DATABASE:');
      console.log(`   Title: ${blog.blog_Title}`);
      console.log(`   Author: ${blog.author}`);
      console.log(`   Created: ${blog.createdAt}`);
      console.log(`   Updated: ${blog.updatedAt}`);
      console.log(`   Published: ${blog.isPublished ? 'Yes' : 'No'}`);
      console.log(`   Content Length: ${blog.blog_Content ? blog.blog_Content.length : 0} characters`);
      console.log(`   Has Content: ${blog.blog_Content ? 'Yes' : 'No'}`);
      
      if (blog.blog_Content) {
        console.log(`   Content Preview: ${blog.blog_Content.substring(0, 200)}...`);
      }
      
      // Check if this blog might be the one that was "deleted" (perhaps content was cleared)
      if (!blog.blog_Content || blog.blog_Content.trim().length === 0) {
        console.log('\n⚠️  BLOG HAS NO CONTENT - This might be the "deleted" blog!');
        console.log('🔄 Attempting to restore content from backup...');
        
        // Try to restore from backup
        const fs = require('fs');
        const path = require('path');
        
        const backupFiles = fs.readdirSync(path.join(__dirname, 'backups'))
          .filter(file => file.includes('khushi-singh') && file.endsWith('.json'));
        
        if (backupFiles.length > 0) {
          const latestBackup = backupFiles.sort().pop();
          const backupPath = path.join(__dirname, 'backups', latestBackup);
          const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
          
          const backupBlog = backupData.blogs.find(b => b.id === blogId);
          
          if (backupBlog && backupBlog.content) {
            console.log('📦 Found content in backup, restoring...');
            
            blog.blog_Content = backupBlog.content;
            blog.updatedAt = new Date();
            
            await blog.save();
            
            console.log('✅ BLOG CONTENT RESTORED SUCCESSFULLY!');
            console.log(`   Content Length: ${blog.blog_Content.length} characters`);
            console.log(`   Content Preview: ${blog.blog_Content.substring(0, 200)}...`);
          } else {
            console.log('❌ No content found in backup either');
          }
        }
      } else {
        console.log('\n✅ Blog has content and appears to be intact');
      }
      
    } else {
      console.log('❌ BLOG NOT FOUND IN DATABASE');
      console.log('🔄 This might be the deleted blog - attempting to restore from backup...');
      
      // Restore from backup
      const fs = require('fs');
      const path = require('path');
      
      const backupFiles = fs.readdirSync(path.join(__dirname, 'backups'))
        .filter(file => file.includes('khushi-singh') && file.endsWith('.json'));
      
      if (backupFiles.length > 0) {
        const latestBackup = backupFiles.sort().pop();
        const backupPath = path.join(__dirname, 'backups', latestBackup);
        const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
        
        const backupBlog = backupData.blogs.find(b => b.id === blogId);
        
        if (backupBlog) {
          console.log('📦 Found blog in backup, restoring...');
          
          // Recreate the blog
          const newBlog = new blogModel({
            blog_Title: backupBlog.title,
            blog_Content: backupBlog.content,
            author: backupBlog.author,
            customUrlId: backupBlog.slug,
            isPublished: backupBlog.isPublished,
            metaTitle: backupBlog.metaTitle,
            metaDescription: backupBlog.metaDescription,
            categories: backupBlog.categories,
            tags: backupBlog.tags,
            blog_Image: backupBlog.blog_Image,
            frontImagePreview: backupBlog.frontImagePreview,
            createdAt: new Date(backupBlog.createdAt),
            updatedAt: new Date()
          });
          
          const savedBlog = await newBlog.save();
          console.log('✅ BLOG RESTORED SUCCESSFULLY!');
          console.log(`   New ID: ${savedBlog._id}`);
          console.log(`   Title: ${savedBlog.blog_Title}`);
          console.log(`   Content Length: ${savedBlog.blog_Content ? savedBlog.blog_Content.length : 0} characters`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the check and recovery
checkSpecificBlog();
