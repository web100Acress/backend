  const mongoose = require('mongoose');
  const ProjectOrderModel = require('./models/projectDetail/projectOrder');
  const readline = require('readline');

  // MongoDB connection string - using your actual database
  const MONGODB_URI = process.env.MONGO_URI || "mongodb+srv://amit100acre:Amit123@cluster0.ffg8qyf.mongodb.net/?retryWrites=true&w=majority";

  // All available builders
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

  // Connect to MongoDB
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

  // Create readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

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

  // Function to reset all builders to random order
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

  // Function to show menu
  function showMenu() {
    console.log('\n=== PROJECT ORDER MANAGEMENT ===');
    console.log('1. List all current orders');
    console.log('2. Update specific builder order');
    console.log('3. Reset all builders to random');
    console.log('4. Show available builders');
    console.log('5. Exit');
    console.log('Enter your choice (1-5):');
  }

  // Function to show available builders
  function showBuilders() {
    console.log('\n=== AVAILABLE BUILDERS ===');
    Object.entries(ALL_BUILDERS).forEach(([key, name], index) => {
      console.log(`${index + 1}. ${key}: ${name}`);
    });
  }

  // Function to get user input
  function askQuestion(question) {
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        resolve(answer);
      });
    });
  }

  // Function to get project IDs from user
  async function getProjectIdsFromUser() {
    console.log('\nEnter project IDs separated by commas (e.g., id1,id2,id3):');
    const input = await askQuestion('Project IDs: ');
    return input.split(',').map(id => id.trim()).filter(id => id.length > 0);
  }

  // Main interactive function
  async function main() {
    console.log('🚀 Interactive Project Order Manager');
    console.log('This tool allows you to update project orders for any builder');
    
    while (true) {
      showMenu();
      const choice = await askQuestion('');
      
      switch (choice) {
        case '1':
          console.log('\n📋 Listing all current orders...');
          await listAllOrders();
          break;
          
        case '2':
          console.log('\n🔄 Update specific builder order');
          showBuilders();
          const builderKey = await askQuestion('Enter builder key (e.g., m3m-india): ');
          
          if (!ALL_BUILDERS[builderKey]) {
            console.log('❌ Invalid builder key!');
            break;
          }
          
          console.log(`\nUpdating ${ALL_BUILDERS[builderKey]}...`);
          const projectIds = await getProjectIdsFromUser();
          
          if (projectIds.length === 0) {
            console.log('❌ No project IDs provided!');
            break;
          }
          
          try {
            await updateBuilderOrder(builderKey, projectIds);
            console.log('✅ Order updated successfully!');
            console.log('🌐 Changes will be visible on all devices immediately');
          } catch (error) {
            console.log('❌ Failed to update order');
          }
          break;
          
        case '3':
          console.log('\n🔄 Resetting all builders to random order...');
          const confirm = await askQuestion('Are you sure? (yes/no): ');
          if (confirm.toLowerCase() === 'yes') {
            await resetAllBuildersToRandom();
            console.log('✅ All builders reset!');
          } else {
            console.log('❌ Operation cancelled');
          }
          break;
          
        case '4':
          showBuilders();
          break;
          
        case '5':
          console.log('👋 Goodbye!');
          rl.close();
          process.exit(0);
          break;
          
        default:
          console.log('❌ Invalid choice! Please enter 1-5');
      }
      
      console.log('\n' + '='.repeat(50));
    }
  }

  // Start the interactive session
  main().catch(error => {
    console.error('❌ Script failed:', error);
    rl.close();
    process.exit(1);
  }); 