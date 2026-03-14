const mongoose = require('mongoose');

// Import blog model
const blogModel = require('./models/blog/blogpost');

async function findTodayDeletedBlog() {
  try {
    // Connect to database
    await mongoose.connect('mongodb+srv://amit100acre:Amit123@cluster0.ffg8qyf.mongodb.net/?retryWrites=true&w=majority');
    console.log('✅ Connected to MongoDB');

    // Get today's date in IST
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    console.log(`🔍 Searching for Khushi Singh blogs created today (${todayStart.toISOString().split('T')[0]})...`);

    // Find Khushi Singh blogs created today
    const todayBlogs = await blogModel.find({
      author: { $regex: 'Khushi Singh', $options: 'i' },
      createdAt: {
        $gte: todayStart,
        $lt: todayEnd
      }
    }).sort({ createdAt: -1 });

    console.log(`📊 Found ${todayBlogs.length} Khushi Singh blogs created today:`);

    if (todayBlogs.length === 0) {
      console.log('❌ No Khushi Singh blogs found created today');
      
      // Check for any blogs created in the last 3 days by Khushi Singh
      console.log('\n🔍 Checking recent Khushi Singh blogs (last 3 days)...');
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const recentBlogs = await blogModel.find({
        author: { $regex: 'Khushi Singh', $options: 'i' },
        createdAt: { $gte: threeDaysAgo }
      }).sort({ createdAt: -1 });

      console.log(`📊 Found ${recentBlogs.length} recent Khushi Singh blogs:`);
      recentBlogs.forEach((blog, index) => {
        console.log(`\n${index + 1}. ID: ${blog._id}`);
        console.log(`   Title: ${blog.blog_Title}`);
        console.log(`   Created: ${blog.createdAt}`);
        console.log(`   Published: ${blog.isPublished ? 'Yes' : 'No'}`);
        console.log(`   Content: ${blog.blog_Content ? blog.blog_Content.substring(0, 100) + '...' : 'No content'}`);
      });
    } else {
      todayBlogs.forEach((blog, index) => {
        console.log(`\n${index + 1}. ID: ${blog._id}`);
        console.log(`   Title: ${blog.blog_Title}`);
        console.log(`   Created: ${blog.createdAt}`);
        console.log(`   Published: ${blog.isPublished ? 'Yes' : 'No'}`);
        console.log(`   Content: ${blog.blog_Content ? blog.blog_Content.substring(0, 100) + '...' : 'No content'}`);
      });
    }

    // Also check if there are any recently deleted blogs by checking the backup
    console.log('\n🔍 Checking backup for comparison...');
    const fs = require('fs');
    const path = require('path');
    
    const backupFiles = fs.readdirSync(path.join(__dirname, 'backups'))
      .filter(file => file.includes('khushi-singh') && file.endsWith('.json'));
    
    if (backupFiles.length > 0) {
      const latestBackup = backupFiles.sort().pop();
      const backupPath = path.join(__dirname, 'backups', latestBackup);
      const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
      
      console.log(`📦 Backup contains ${backupData.blogs.length} blogs`);
      
      // Find blogs that are in backup but not in current database
      const currentBlogIds = todayBlogs.map(b => b._id.toString());
      const missingBlogs = backupData.blogs.filter(blog => 
        blog.author.includes('Khushi Singh') && 
        !currentBlogIds.includes(blog.id)
      );
      
      if (missingBlogs.length > 0) {
        console.log(`\n⚠️  Found ${missingBlogs.length} Khushi Singh blogs in backup but not in current database:`);
        missingBlogs.forEach((blog, index) => {
          console.log(`\n${index + 1}. ID: ${blog.id}`);
          console.log(`   Title: ${blog.title}`);
          console.log(`   Created: ${blog.createdAt}`);
          console.log(`   Published: ${blog.isPublished ? 'Yes' : 'No'}`);
        });
        
        console.log('\n🎯 These might be the deleted blogs!');
        console.log('💡 To recover, run:');
        console.log('   node backups/recover-khushi-blog.js');
        console.log('   Then call: recoverBlog("BLOG_ID_HERE")');
      } else {
        console.log('\n✅ All Khushi Singh blogs from backup are present in current database');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the search
findTodayDeletedBlog();
