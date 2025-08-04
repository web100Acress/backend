const mongoose = require('mongoose');
const ProjectOrderModel = require('./models/projectDetail/projectOrder');

// MongoDB connection string
const MONGODB_URI = process.env.MONGO_URI || "mongodb+srv://amit100acre:Amit123@cluster0.ffg8qyf.mongodb.net/?retryWrites=true&w=majority";

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Test M3M project IDs (current order)
const currentM3MOrder = [
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

// Function to update M3M order
async function updateM3MOrder() {
  try {
    console.log('🔄 Updating M3M project order...');
    
    // Reverse the order to test global sync
    const reversedOrder = [...currentM3MOrder].reverse();
    
    const result = await ProjectOrderModel.findOneAndUpdate(
      { builderName: 'm3m-india' },
      {
        customOrder: reversedOrder,
        hasCustomOrder: true,
        lastUpdated: new Date(),
        updatedBy: 'admin'
      },
      { upsert: true, new: true }
    );
    
    console.log('✅ M3M project order updated successfully!');
    console.log('Total projects:', result.customOrder.length);
    console.log('🌐 Changes will be visible on all devices immediately');
    console.log('📱 Check your main website now - the order should be reversed!');
    
    return result;
  } catch (error) {
    console.error('❌ Error updating M3M order:', error);
    throw error;
  }
}

// Function to show current M3M order
async function showCurrentM3MOrder() {
  try {
    const result = await ProjectOrderModel.findOne({ builderName: 'm3m-india' });
    if (result) {
      console.log('📋 Current M3M order:');
      console.log('Total projects:', result.customOrder.length);
      console.log('Has custom order:', result.hasCustomOrder);
      return result;
    } else {
      console.log('❌ No M3M order found');
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting M3M order:', error);
    throw error;
  }
}

// Main execution
async function main() {
  console.log('=== GLOBAL SYNC TEST ===\n');
  
  // Show current order
  await showCurrentM3MOrder();
  
  console.log('\n🔄 Testing global sync by reversing M3M order...');
  
  // Update the order
  await updateM3MOrder();
  
  console.log('\n✅ Test completed!');
  console.log('🌐 Now check your main website: https://www.100acress.com/developers/m3m-india/');
  console.log('📱 The M3M projects should now be in reverse order');
  console.log('🔄 The admin panel should also show the reversed order');
  
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
}); 