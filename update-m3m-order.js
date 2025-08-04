const mongoose = require('mongoose');
const ProjectOrderModel = require('./models/projectDetail/projectOrder');

// MongoDB connection string - replace with your actual connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/your_database_name';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Current M3M project IDs from your API response
const currentM3MProjects = [
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

// Function to reorder M3M projects
async function reorderM3MProjects(newOrder) {
  try {
    const result = await ProjectOrderModel.findOneAndUpdate(
      { builderName: 'm3m-india' },
      {
        customOrder: newOrder,
        hasCustomOrder: true,
        lastUpdated: new Date(),
        updatedBy: 'admin'
      },
      { upsert: true, new: true }
    );
    
    console.log('✅ M3M project order updated successfully!');
    console.log('New order:', result.customOrder);
    console.log('Total projects:', result.customOrder.length);
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
      console.log('Order:', result.customOrder);
      console.log('Total projects:', result.customOrder.length);
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

// Example: Reorder M3M projects (modify this array to change the order)
async function updateM3MOrder() {
  console.log('🔄 Updating M3M project order...');
  
  // MODIFY THIS ARRAY TO CHANGE THE ORDER
  // Just rearrange the project IDs in your desired order
  const newM3MOrder = [
    "666e946265d38975d1fc48a2", // M3M Mansion (currently first)
    "65e1b079161ac8b2c1dc1271", // M3M Corner Walk (currently second)
    "666ea4d165d38975d1fc6803", // M3M The Line (currently third)
    // ... add more project IDs in your desired order
    // You can copy from currentM3MProjects and rearrange them
  ];
  
  // For now, let's just reverse the order as an example
  const reversedOrder = [...currentM3MProjects].reverse();
  
  await reorderM3MProjects(reversedOrder);
}

// Main execution
async function main() {
  console.log('=== M3M PROJECT ORDER UPDATE ===\n');
  
  // Show current order
  await showCurrentM3MOrder();
  
  console.log('\n🔄 Updating order...');
  
  // Update the order (modify the function above to change the order)
  await updateM3MOrder();
  
  console.log('\n✅ Update completed!');
  console.log('🌐 Changes will be visible on all devices immediately');
  
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
}); 