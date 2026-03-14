const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Import blog model
const blogModel = require('./models/blog/blogpost');

async function findActuallyDeletedBlog() {
  try {
    // Connect to database
    await mongoose.connect('mongodb+srv://amit100acre:Amit123@cluster0.ffg8qyf.mongodb.net/?retryWrites=true&w=majority');
    console.log('✅ Connected to MongoDB');

    // Get all current Khushi Singh blogs in database
    const currentBlogs = await blogModel.find({
      author: { $regex: 'Khushi Singh', $options: 'i' }
    });
    
    console.log(`📊 Current database has ${currentBlogs.length} Khushi Singh blogs`);

    // Load backup
    const backupFiles = fs.readdirSync(path.join(__dirname, 'backups'))
      .filter(file => file.includes('khushi-singh') && file.endsWith('.json'));
    
    if (backupFiles.length === 0) {
      console.log('❌ No backup files found');
      return;
    }

    const latestBackup = backupFiles.sort().pop();
    const backupPath = path.join(__dirname, 'backups', latestBackup);
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    console.log(`📦 Backup contains ${backupData.blogs.length} blogs`);

    // Get current blog IDs as strings for comparison
    const currentBlogIds = currentBlogs.map(b => b._id.toString());
    
    // Find blogs that are in backup but not in current database
    const actuallyDeletedBlogs = backupData.blogs.filter(blog => 
      blog.author.includes('Khushi Singh') && 
      !currentBlogIds.includes(blog.id)
    );

    if (actuallyDeletedBlogs.length > 0) {
      console.log(`\n🚨 FOUND ${actuallyDeletedBlogs.length} ACTUALLY DELETED Khushi Singh blogs:`);
      
      actuallyDeletedBlogs.forEach((blog, index) => {
        const blogDate = new Date(blog.createdAt);
        const isToday = blogDate.toDateString() === new Date().toDateString();
        
        console.log(`\n${index + 1}. 🗑️  DELETED BLOG`);
        console.log(`   ID: ${blog.id}`);
        console.log(`   Title: ${blog.title}`);
        console.log(`   Created: ${blog.createdAt}`);
        console.log(`   Published: ${blog.isPublished ? 'Yes' : 'No'}`);
        console.log(`   Deleted Today: ${isToday ? '🔴 YES' : '❌ No'}`);
        console.log(`   Content: ${blog.content ? blog.content.substring(0, 100) + '...' : 'No content'}`);
      });

      // Auto-recover the most recently deleted blog
      const mostRecentDeleted = actuallyDeletedBlogs
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

      console.log(`\n🎯 MOST RECENT DELETED BLOG:`);
      console.log(`   Title: ${mostRecentDeleted.title}`);
      console.log(`   ID: ${mostRecentDeleted.id}`);
      console.log(`   Created: ${mostRecentDeleted.createdAt}`);

      console.log(`\n🚀 AUTO-RECOVERING THIS BLOG NOW...`);
      
      // Recreate the blog
      const newBlog = new blogModel({
        blog_Title: mostRecentDeleted.title,
        blog_Content: mostRecentDeleted.content,
        author: mostRecentDeleted.author,
        customUrlId: mostRecentDeleted.slug,
        isPublished: mostRecentDeleted.isPublished,
        metaTitle: mostRecentDeleted.metaTitle,
        metaDescription: mostRecentDeleted.metaDescription,
        categories: mostRecentDeleted.categories,
        tags: mostRecentDeleted.tags,
        blog_Image: mostRecentDeleted.blog_Image,
        frontImagePreview: mostRecentDeleted.frontImagePreview,
        createdAt: new Date(mostRecentDeleted.createdAt),
        updatedAt: new Date()
      });
      
      const savedBlog = await newBlog.save();
      console.log('✅ BLOG RECOVERED SUCCESSFULLY!');
      console.log(`   New ID: ${savedBlog._id}`);
      console.log(`   Title: ${savedBlog.blog_Title}`);
      console.log(`   Published: ${savedBlog.isPublished ? 'Yes' : 'No'}`);
      
    } else {
      console.log('\n✅ No Khushi Singh blogs have been deleted');
      console.log('   All blogs from backup are present in current database');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the search and recovery
findActuallyDeletedBlog();
