const mongoose = require('mongoose');
const ProjectOrderModel = require('./models/projectDetail/projectOrder');

// MongoDB connection string - using your actual database
const MONGODB_URI = process.env.MONGO_URI || "mongodb+srv://amit100acre:Amit123@cluster0.ffg8qyf.mongodb.net/?retryWrites=true&w=majority";

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// All available builders from your frontend
const ALL_BUILDERS = {
  'signature-global': 'Signature Global',
  'm3m-india': 'M3M India',
  'dlf-homes': 'DLF Homes',
  'experion-developers': 'Experion Developers',
  'elan-group': 'Elan Group',
  'bptp-limited': 'BPTP LTD',
  'adani-realty': 'Adani Realty',
  'smartworld-developers': 'Smartworld',
  'trevoc-group': 'Trevoc Group',
  'indiabulls-real-estate': 'Indiabulls',
  'central-park': 'Central Park',
  'emaar-india': 'Emaar India',
  'godrej-properties': 'Godrej Properties',
  'whiteland': 'Whiteland Corporation',
  'aipl': 'AIPL',
  'birla-estate': 'Birla Estates',
  'sobha-developers': 'Sobha',
  'trump-towers': 'Trump Towers',
  'puri-developers': 'Puri Constructions',
  'aarize-developers': 'Aarize Group'
};

// Function to update project order for any builder
async function updateBuilderOrder(builderName, newOrder) {
  try {
    const result = await ProjectOrderModel.findOneAndUpdate(
      { builderName },
      {
        customOrder: newOrder,
        hasCustomOrder: true,
        lastUpdated: new Date(),
        updatedBy: 'admin'
      },
      { upsert: true, new: true }
    );
    
    console.log(`✅ Updated project order for ${builderName}:`);
    console.log('New order:', result.customOrder);
    console.log('Total projects:', result.customOrder.length);
    return result;
  } catch (error) {
    console.error(`❌ Error updating ${builderName}:`, error);
    throw error;
  }
}

// Function to get current order for any builder
async function getBuilderOrder(builderName) {
  try {
    const result = await ProjectOrderModel.findOne({ builderName });
    if (result) {
      console.log(`📋 Current order for ${builderName}:`);
      console.log('Order:', result.customOrder);
      console.log('Total projects:', result.customOrder.length);
      return result;
    } else {
      console.log(`❌ No order found for ${builderName}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error getting ${builderName}:`, error);
    throw error;
  }
}

// Function to list all current orders
async function listAllOrders() {
  try {
    const orders = await ProjectOrderModel.find({}).sort({ builderName: 1 });
    console.log('📋 All Current Project Orders:');
    orders.forEach(order => {
      console.log(`${order.builderName}: ${order.customOrder.length} projects`);
    });
    return orders;
  } catch (error) {
    console.error('❌ Error listing orders:', error);
    throw error;
  }
}

// Function to reset all builders to random order (remove custom orders)
async function resetAllBuildersToRandom() {
  try {
    console.log('🔄 Resetting all builders to random order...');
    
    for (const [builderKey, builderName] of Object.entries(ALL_BUILDERS)) {
      await ProjectOrderModel.findOneAndUpdate(
        { builderName: builderKey },
        {
          customOrder: [],
          hasCustomOrder: false,
          randomSeed: Math.floor(Math.random() * 1000000),
          lastUpdated: new Date(),
          updatedBy: 'admin'
        },
        { upsert: true, new: true }
      );
      console.log(`✅ Reset ${builderName} to random order`);
    }
    
    console.log('✅ All builders reset to random order!');
  } catch (error) {
    console.error('❌ Error resetting builders:', error);
    throw error;
  }
}

// Function to update specific builder with custom order
async function updateSpecificBuilder(builderName, projectIds) {
  try {
    console.log(`🔄 Updating ${builderName} with custom order...`);
    
    if (!projectIds || projectIds.length === 0) {
      console.log(`❌ No project IDs provided for ${builderName}`);
      return;
    }
    
    await updateBuilderOrder(builderName, projectIds);
    console.log(`✅ ${builderName} updated successfully!`);
  } catch (error) {
    console.error(`❌ Error updating ${builderName}:`, error);
  }
}

// Example: Update M3M with a specific order
async function updateM3MExample() {
  const m3mProjectIds = [
    "666e946265d38975d1fc48a2", // M3M Mansion
    "65e1b079161ac8b2c1dc1271", // M3M Corner Walk
    "666ea4d165d38975d1fc6803", // M3M The Line
    "6670064c65d38975d1fea3e7",
    "666d5bab65d38975d1f9f03e",
    "66701cd865d38975d1fee5eb",
    "6645f4995ce6998c9e473f84",
    "664893b954a1abc22789d1fc",
    "666e8bf665d38975d1fc3035",
    "6628fff53e500ef321c28468",
    "66a5e362c7f5859854eae5aa",
    "65f95cc88f9c07384c029d26",
    "663752acdf6f5a16378c95a5",
    "6684fa6fa9874941c195568f",
    "688cba1ae045cb117877429e",
    "65f9568f8f9c07384c018ee3",
    "67a35c8741bd5a5a4f2c5ed3",
    "67949f0e66979340d986dc71",
    "662f7457df6f5a1637800105",
    "664603225ce6998c9e4772b1",
    "688cc134e045cb117877578e",
    "663b2285df6f5a163792467d",
    "65f94eab8f9c07384c003485",
    "66e7f0fd19795190cb2bcf45",
    "678f342a338cec511d09ae1c",
    "666d3f5765d38975d1f9c569",
    "6670261065d38975d1ff07e8",
    "666d632765d38975d1fa06f5",
    "66489cb954a1abc22789edee"
  ];
  
  // Reverse the order as an example
  const reversedM3MOrder = [...m3mProjectIds].reverse();
  await updateSpecificBuilder('m3m-india', reversedM3MOrder);
}

// Main execution
async function main() {
  console.log('=== ALL BUILDERS PROJECT ORDER MANAGEMENT ===\n');
  
  // List all current orders
  await listAllOrders();
  
  console.log('\n=== AVAILABLE BUILDERS ===');
  Object.entries(ALL_BUILDERS).forEach(([key, name]) => {
    console.log(`${key}: ${name}`);
  });
  
  console.log('\n=== USAGE EXAMPLES ===');
  console.log('1. To update M3M order: updateSpecificBuilder("m3m-india", [projectIds])');
  console.log('2. To reset all to random: resetAllBuildersToRandom()');
  console.log('3. To get current order: getBuilderOrder("m3m-india")');
  console.log('4. To list all orders: listAllOrders()');
  
  // Example: Update M3M order
  console.log('\n🔄 Running M3M example update...');
  await updateM3MExample();
  
  console.log('\n✅ Script completed!');
  console.log('🌐 Changes will be visible on all devices immediately');
  
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});

// Export functions for manual use
module.exports = {
  updateBuilderOrder,
  getBuilderOrder,
  listAllOrders,
  resetAllBuildersToRandom,
  updateSpecificBuilder,
  ALL_BUILDERS
}; 