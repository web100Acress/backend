const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Import blog model
const blogModel = require('./models/blog/blogpost');

async function backupKhushiSinghBlogs() {
  try {
    // Connect to database
    await mongoose.connect('mongodb+srv://amit100acre:Amit123@cluster0.ffg8qyf.mongodb.net/?retryWrites=true&w=majority');
    console.log('✅ Connected to MongoDB');

    // Find all blogs by Khushi Singh
    const khushiBlogs = await blogModel.find({
      author: { $regex: 'Khushi Singh', $options: 'i' }
    }).sort({ createdAt: -1 });

    console.log(`📊 Found ${khushiBlogs.length} blogs by Khushi Singh`);

    // Create backup data
    const backupData = {
      backupDate: new Date().toISOString(),
      totalBlogs: khushiBlogs.length,
      blogs: khushiBlogs.map(blog => ({
        id: blog._id,
        title: blog.blog_Title,
        slug: blog.customUrlId || blog.slug,
        content: blog.blog_Content,
        author: blog.author,
        createdAt: blog.createdAt,
        isPublished: blog.isPublished,
        metaTitle: blog.metaTitle,
        metaDescription: blog.metaDescription,
        categories: blog.categories,
        tags: blog.tags,
        blog_Image: blog.blog_Image,
        frontImagePreview: blog.frontImagePreview
      }))
    };

    // Save backup to file
    const backupFileName = `khushi-singh-blogs-backup-${new Date().toISOString().split('T')[0]}.json`;
    const backupPath = path.join(__dirname, 'backups', backupFileName);

    // Create backups directory if it doesn't exist
    if (!fs.existsSync(path.join(__dirname, 'backups'))) {
      fs.mkdirSync(path.join(__dirname, 'backups'));
    }

    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    console.log(`💾 Backup saved to: ${backupPath}`);

    // Display all blogs for easy identification
    console.log('\n📋 All Khushi Singh Blogs:');
    khushiBlogs.forEach((blog, index) => {
      console.log(`\n${index + 1}. ID: ${blog._id}`);
      console.log(`   Title: ${blog.blog_Title}`);
      console.log(`   Slug: ${blog.customUrlId || blog.slug}`);
      console.log(`   Published: ${blog.isPublished ? 'Yes' : 'No'}`);
      console.log(`   Created: ${blog.createdAt}`);
      console.log(`   Content Length: ${blog.blog_Content ? blog.blog_Content.length : 0} characters`);
    });

    // Create a simple recovery script
    const recoveryScript = `
const mongoose = require('mongoose');
const blogModel = require('./models/blog/blogpost');

async function recoverBlog(blogId) {
  try {
    await mongoose.connect('mongodb+srv://amit100acre:Amit123@cluster0.ffg8qyf.mongodb.net/?retryWrites=true&w=majority');
    
    const backupData = require('./${backupPath}');
    const blogToRecover = backupData.blogs.find(b => b.id === blogId);
    
    if (!blogToRecover) {
      console.log('❌ Blog not found in backup');
      return;
    }
    
    // Recreate the blog
    const newBlog = new blogModel({
      blog_Title: blogToRecover.title,
      blog_Content: blogToRecover.content,
      author: blogToRecover.author,
      customUrlId: blogToRecover.slug,
      isPublished: blogToRecover.isPublished,
      metaTitle: blogToRecover.metaTitle,
      metaDescription: blogToRecover.metaDescription,
      categories: blogToRecover.categories,
      tags: blogToRecover.tags,
      blog_Image: blogToRecover.blog_Image,
      frontImagePreview: blogToRecover.frontImagePreview,
      createdAt: blogToRecover.createdAt,
      updatedAt: new Date()
    });
    
    const savedBlog = await newBlog.save();
    console.log('✅ Blog recovered successfully:', savedBlog._id);
    
  } catch (error) {
    console.error('❌ Recovery error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Usage: recoverBlog('YOUR_BLOG_ID_HERE')
module.exports = { recoverBlog };
`;

    const recoveryScriptPath = path.join(__dirname, 'backups', 'recover-khushi-blog.js');
    fs.writeFileSync(recoveryScriptPath, recoveryScript);
    console.log(`🔧 Recovery script created: ${recoveryScriptPath}`);

    console.log('\n🎯 To recover a deleted blog:');
    console.log('1. Identify the blog ID from the list above');
    console.log('2. Run: node backups/recover-khushi-blog.js');
    console.log('3. Call: recoverBlog("BLOG_ID_HERE")');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the backup
backupKhushiSinghBlogs();
