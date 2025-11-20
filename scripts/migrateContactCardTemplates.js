/**
 * Migration Script: Add template field to existing contact cards
 * Run this once to update all existing contact cards with default template
 * 
 * Usage: node backend/scripts/migrateContactCardTemplates.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import the ContactCard model
const ContactCard = require('../models/contactCard/contactCard');

const migrateTemplates = async () => {
  try {
    console.log('🚀 Starting template migration...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/100acress';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find all contact cards without a template field
    const cardsWithoutTemplate = await ContactCard.find({
      $or: [
        { template: { $exists: false } },
        { template: null },
        { template: '' }
      ]
    });

    console.log(`📊 Found ${cardsWithoutTemplate.length} cards without template field`);

    if (cardsWithoutTemplate.length === 0) {
      console.log('✨ All cards already have template field. Nothing to migrate.');
      process.exit(0);
    }

    // Update each card with default template
    let successCount = 0;
    let errorCount = 0;

    for (const card of cardsWithoutTemplate) {
      try {
        card.template = 'modern'; // Set default template
        await card.save();
        successCount++;
        console.log(`✅ Updated card: ${card.name} (${card.slug})`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Error updating card ${card.slug}:`, error.message);
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   Total cards found: ${cardsWithoutTemplate.length}`);
    console.log(`   ✅ Successfully updated: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);

    if (errorCount === 0) {
      console.log('\n🎉 Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with some errors. Please check the logs above.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run migration
migrateTemplates();
