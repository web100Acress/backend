const mongoose = require('mongoose');

// Blog schema
const blogSchema = new mongoose.Schema({
  blog_Image: {
    public_id: String,
    url: String,
    cdn_url: String
  },
  blog_Title: String,
  blog_Description: String,
  author: String,
  blog_Category: String,
  isPublished: Boolean,
  metaTitle: String,
  metaDescription: String,
  slug: String
}, {timestamps: true});

const blogModel = mongoose.model("Blog", blogSchema);

async function cleanupPlaceholderImages() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect('mongodb+srv://amitchaudhary:amit123@cluster0.ffg8qyf.mongodb.net/test');
    console.log('✅ Connected to MongoDB');
    
    console.log('🔍 Finding blogs with placeholder images...');
    
    // Find all blogs with placeholder images
    const blogsWithPlaceholders = await blogModel.find({
      $or: [
        { 'blog_Image.url': { $regex: /^data:image\/svg\+xml/ } },
        { 'blog_Image.public_id': { $regex: /^placeholder\// } },
        { 'blog_Image.public_id': { $regex: /^temp\// } }
      ]
    });

    console.log(`📊 Found ${blogsWithPlaceholders.length} blogs with placeholder images`);

    let fixedCount = 0;
    for (const blog of blogsWithPlaceholders) {
      console.log(`🔧 Fixing blog: "${blog.blog_Title}"`);
      
      // Clear the placeholder image data - set to undefined so it shows no image
      await blogModel.updateOne(
        { _id: blog._id },
        { $unset: { blog_Image: 1 } }
      );
      
      fixedCount++;
    }

    console.log(`✅ Successfully cleaned up ${fixedCount} blogs with placeholder images`);
    console.log('🎉 Cleanup complete! Now you can upload actual images to these blogs.');
    
    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupPlaceholderImages();
