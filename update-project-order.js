const mongoose = require('mongoose');
const ProjectOrderModel = require('./models/projectDetail/projectOrder');

// MongoDB connection string - using your actual database
const MONGODB_URI = process.env.MONGO_URI || "mongodb+srv://amit100acre:Amit123@cluster0.ffg8qyf.mongodb.net/?retryWrites=true&w=majority";

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Function to update project order for a builder
async function updateProjectOrder(builderName, newOrder) {
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
    return result;
  } catch (error) {
    console.error(`❌ Error updating ${builderName}:`, error);
    throw error;
  }
}

// Function to get current project order
async function getProjectOrder(builderName) {
  try {
    const result = await ProjectOrderModel.findOne({ builderName });
    if (result) {
      console.log(`📋 Current order for ${builderName}:`);
      console.log('Order:', result.customOrder);
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

// Function to list all project orders
async function listAllOrders() {
  try {
    const orders = await ProjectOrderModel.find({}).sort({ builderName: 1 });
    console.log('📋 All Project Orders:');
    orders.forEach(order => {
      console.log(`${order.builderName}: ${order.customOrder.length} projects`);
    });
    return orders;
  } catch (error) {
    console.error('❌ Error listing orders:', error);
    throw error;
  }
}

// Example usage functions
async function examples() {
  console.log('\n=== PROJECT ORDER MANAGEMENT ===\n');
  
  // List all current orders
  await listAllOrders();
  
  // Get current order for m3m-india
  await getProjectOrder('m3m-india');
  
  // Example: Update m3m-india order (you can modify this)
  // const newM3MOrder = [
  //   "666e946265d38975d1fc48a2", // First project
  //   "65e1b079161ac8b2c1dc1271", // Second project
  //   // ... add more project IDs in your desired order
  // ];
  // await updateProjectOrder('m3m-india', newM3MOrder);
  
  console.log('\n=== USAGE ===');
  console.log('To update an order, call: updateProjectOrder(builderName, [projectIds])');
  console.log('To get current order, call: getProjectOrder(builderName)');
  console.log('To list all orders, call: listAllOrders()');
}

// Run examples
examples()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

// Export functions for manual use
module.exports = {
  updateProjectOrder,
  getProjectOrder,
  listAllOrders
}; 