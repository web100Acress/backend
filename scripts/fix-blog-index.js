const mongoose = require('mongoose');
const blogModel = require('../models/blog/blogpost');

async function fixBlogIndex() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGO_URI || "mongodb+srv://amit100acre:Amit123@cluster0.ffg8qyf.mongodb.net/?retryWrites=true&w=majority";
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get the raw MongoDB collection
    const collection = mongoose.connection.db.collection('blogs');
    
    // Drop the existing index
    try {
      await collection.dropIndex('customUrlId_1');
      console.log('Dropped existing customUrlId index');
    } catch (err) {
      if (err.codeName !== 'NamespaceNotFound') {
        console.log('No existing customUrlId index found, creating new one...');
      } else {
        throw err;
      }
    }

    // Create a new sparse index
    await collection.createIndex({ customUrlId: 1 }, { unique: true, sparse: true });
    console.log('Created new sparse index on customUrlId');

    console.log('✅ Index fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing blog index:', error);
    process.exit(1);
  }
}

fixBlogIndex();
