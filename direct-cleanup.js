const { MongoClient } = require('mongodb');

async function cleanupPlaceholders() {
  const client = new MongoClient('mongodb+srv://amitchaudhary:amit123@cluster0.ffg8qyf.mongodb.net/test');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('test');
    const collection = db.collection('blogs');
    
    // Find blogs with placeholder images
    const placeholderBlogs = await collection.find({
      $or: [
        { 'blog_Image.url': { $regex: /^data:image\/svg\+xml/ } },
        { 'blog_Image.public_id': { $regex: /^placeholder\// } },
        { 'blog_Image.public_id': { $regex: /^temp\// } }
      ]
    }).toArray();
    
    console.log(`Found ${placeholderBlogs.length} blogs with placeholder images`);
    
    // Remove placeholder image data
    const result = await collection.updateMany(
      {
        $or: [
          { 'blog_Image.url': { $regex: /^data:image\/svg\+xml/ } },
          { 'blog_Image.public_id': { $regex: /^placeholder\// } },
          { 'blog_Image.public_id': { $regex: /^temp\// } }
        ]
      },
      { $unset: { blog_Image: 1 } }
    );
    
    console.log(`Cleaned up ${result.modifiedCount} blog posts`);
    console.log('Placeholder images removed successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

cleanupPlaceholders();
