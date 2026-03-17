const mongoose = require('mongoose');
require('dotenv').config();

// Database indexes for performance optimization
const createIndexes = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://amit100acre:Amit123@cluster0.ffg8qyf.mongodb.net/?retryWrites=true&w=majority');
    
    console.log('🔗 Connected to MongoDB');

    const db = mongoose.connection.db;
    const projectsCollection = db.collection('projects');

    // Create indexes for better query performance
    const indexes = [
      // Basic query indexes
      { key: { isHidden: 1 }, name: 'idx_hidden' },
      { key: { createdAt: -1 }, name: 'idx_created_at_desc' },
      { key: { city: 1, isHidden: 1 }, name: 'idx_city_hidden' },
      { key: { state: 1, isHidden: 1 }, name: 'idx_state_hidden' },
      { key: { type: 1, isHidden: 1 }, name: 'idx_type_hidden' },
      
      // Search and filter indexes
      { key: { projectOverview: 1, isHidden: 1 }, name: 'idx_overview_hidden' },
      { key: { luxury: 1, isHidden: 1 }, name: 'idx_luxury_hidden' },
      { key: { spotlight: 1, isHidden: 1 }, name: 'idx_spotlight_hidden' },
      
      // Compound indexes for common queries
      { key: { city: 1, type: 1, isHidden: 1 }, name: 'idx_city_type_hidden' },
      { key: { state: 1, city: 1, isHidden: 1 }, name: 'idx_state_city_hidden' },
      { key: { type: 1, projectOverview: 1, isHidden: 1 }, name: 'idx_type_overview_hidden' },
      
      // URL and unique indexes
      { key: { project_url: 1 }, name: 'idx_project_url', unique: true },
      
      // Price range indexes
      { key: { minPrice: 1, maxPrice: 1, isHidden: 1 }, name: 'idx_price_range_hidden' },
      
      // Text search index for project names
      { key: { projectName: 'text', projectAddress: 'text' }, name: 'idx_text_search' }
    ];

    console.log('🚀 Creating indexes...');

    for (const index of indexes) {
      try {
        await projectsCollection.createIndex(index.key, { 
          name: index.name,
          unique: index.unique || false,
          background: true 
        });
        console.log(`✅ Created index: ${index.name}`);
      } catch (error) {
        if (error.code === 85) {
          console.log(`⚠️  Index already exists: ${index.name}`);
        } else {
          console.error(`❌ Error creating index ${index.name}:`, error.message);
        }
      }
    }

    // Analyze query performance
    console.log('\n📊 Analyzing collection stats...');
    const stats = await db.collection('projects').aggregate([{ $collStats: {} }]).toArray();
    if (stats.length > 0) {
      const collectionStats = stats[0];
      console.log(`   Documents: ${collectionStats.count}`);
      console.log(`   Avg doc size: ${(collectionStats.avgObjSize / 1024).toFixed(2)}KB`);
      console.log(`   Total size: ${(collectionStats.size / 1024 / 1024).toFixed(2)}MB`);
      console.log(`   Indexes: ${collectionStats.nindexes}`);
    }

    // Get index usage stats
    console.log('\n📈 Index usage stats:');
    const indexStats = await projectsCollection.aggregate([{ $indexStats: {} }]);
    indexStats.forEach(stat => {
      if (stat.name !== '_id_') {
        console.log(`   ${stat.name}: ${stat.accesses.ops} operations`);
      }
    });

    console.log('\n🎉 Database optimization complete!');
    
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the optimization
createIndexes();
