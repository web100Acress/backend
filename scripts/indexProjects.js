#!/usr/bin/env node

// Project Indexer for 100acress.com
// Syncs MongoDB projects to Elasticsearch

const mongoose = require('mongoose');
const Project = require('../models/Project');
const ElasticsearchService = require('../services/ElasticsearchService');

class ProjectIndexer {
  constructor() {
    this.batchSize = 1000;
    this.delay = 1000; // 1 second between batches
  }

  // Full indexing of all projects
  async indexAllProjects() {
    console.log('🚀 Starting full project indexing...');
    
    try {
      // Connect to MongoDB
      await mongoose.connect(process.env.MONGODB_URI);
      
      // Initialize Elasticsearch index
      await ElasticsearchService.initializeIndex();
      
      // Get total project count
      const totalProjects = await Project.countDocuments({ status: 'active' });
      console.log(`📊 Found ${totalProjects} projects to index`);
      
      // Process in batches
      let processed = 0;
      let hasMore = true;
      
      while (hasMore) {
        const projects = await Project.find({ status: 'active' })
          .lean()
          .skip(processed)
          .limit(this.batchSize);
        
        if (projects.length === 0) {
          hasMore = false;
          break;
        }
        
        console.log(`📦 Processing batch ${Math.floor(processed / this.batchSize) + 1} (${projects.length} projects)...`);
        
        const result = await ElasticsearchService.indexAllProjects();
        
        console.log(`✅ Indexed ${result.indexed} projects (errors: ${result.errors})`);
        
        processed += projects.length;
        
        // Progress indicator
        const progress = ((processed / totalProjects) * 100).toFixed(1);
        process.stdout.write(`\r🔍 Progress: ${progress}% (${processed}/${totalProjects})`);
        
        // Wait before next batch
        await this.sleep(this.delay);
      }
      
      console.log('\n✅ Full indexing completed!');
      console.log(`📊 Total processed: ${processed} projects`);
      
      // Disconnect from MongoDB
      await mongoose.disconnect();
      
    } catch (error) {
      console.error('❌ Indexing error:', error);
      process.exit(1);
    }
  }

  // Real-time project updates
  async watchProjectUpdates() {
    console.log('👁 Watching for project updates...');
    
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      
      // Watch for changes in projects collection
      const changeStream = Project.watch([
        { $match: { operationType: { $in: ['insert', 'update', 'delete'] } } }
      ]);
      
      changeStream.on('change', async (change) => {
        console.log(`📝 Project ${change.operationType}: ${change.documentKey._id}`);
        
        try {
          switch (change.operationType) {
            case 'insert':
              await ElasticsearchService.indexAllProjects();
              break;
            case 'update':
              await ElasticsearchService.updateProject(
                change.documentKey._id,
                change.fullDocument
              );
              break;
            case 'delete':
              await ElasticsearchService.deleteProject(change.documentKey._id);
              break;
          }
        } catch (esError) {
          console.error(`❌ Elasticsearch sync error: ${esError.message}`);
        }
      });
      
      console.log('👁 Real-time sync active');
      
    } catch (error) {
      console.error('❌ Watcher error:', error);
      process.exit(1);
    }
  }

  // Sleep utility
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI interface
const indexer = new ProjectIndexer();

// Parse command line arguments
const command = process.argv[2];

switch (command) {
  case 'index-all':
    indexer.indexAllProjects();
    break;
  case 'watch':
    indexer.watchProjectUpdates();
    break;
  default:
    console.log('📋 Usage:');
    console.log('  node indexProjects.js index-all  # Index all projects');
    console.log('  node indexProjects.js watch       # Watch for real-time updates');
    process.exit(1);
}

module.exports = ProjectIndexer;
