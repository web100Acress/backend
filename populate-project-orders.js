const mongoose = require('mongoose');
require('dotenv').config();

// Import the ProjectOrder model
const ProjectOrder = require('./models/ProjectOrder');

const defaultData = {
  luxury: [
    { id: 1, name: "Elan The Emperor", order: 1, isActive: true },
    { id: 2, name: "Experion The Trillion", order: 2, isActive: true },
    { id: 3, name: "Birla Arika", order: 3, isActive: true },
    { id: 4, name: "DLF Privana North", order: 4, isActive: true }
  ],
  trending: [
    { id: 5, name: "Indiabulls Estate Club", order: 1, isActive: true },
    { id: 6, name: "Signature Global Twin Tower DXP", order: 2, isActive: true },
    { id: 7, name: "Tarc Ishva", order: 3, isActive: true }
  ],
  affordable: [
    { id: 8, name: "Wal 92", order: 1, isActive: true },
    { id: 9, name: "TLC The First Acre", order: 2, isActive: true }
  ],
  sco: [
    { id: 10, name: "SCO Plot 1", order: 1, isActive: true },
    { id: 11, name: "SCO Plot 2", order: 2, isActive: true }
  ],
  commercial: [
    { id: 12, name: "Commercial Project 1", order: 1, isActive: true },
    { id: 13, name: "Commercial Project 2", order: 2, isActive: true }
  ],
  budget: [
    { id: 14, name: "Budget Project 1", order: 1, isActive: true },
    { id: 15, name: "Budget Project 2", order: 2, isActive: true }
  ],
  recommended: [
    { id: 16, name: "Recommended Project 1", order: 1, isActive: true },
    { id: 17, name: "Recommended Project 2", order: 2, isActive: true }
  ],
  desiredLuxury: [
    { id: 18, name: "Desired Luxury 1", order: 1, isActive: true },
    { id: 19, name: "Desired Luxury 2", order: 2, isActive: true }
  ],
  budgetPlots: [
    { id: 20, name: "Budget Plot 1", order: 1, isActive: true, link: "/budget-plot-1", image: "/Images/budget-plot-1.jpg" },
    { id: 21, name: "Budget Plot 2", order: 2, isActive: true, link: "/budget-plot-2", image: "/Images/budget-plot-2.jpg" }
  ]
};

async function populateDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/100acress');
    console.log('Connected to MongoDB');

    // Check if data already exists
    const existingData = await ProjectOrder.findOne();
    if (existingData) {
      console.log('Project order data already exists, updating...');
      existingData.data = defaultData;
      await existingData.save();
      console.log('Project order data updated successfully!');
    } else {
      console.log('Creating new project order data...');
      const projectOrder = new ProjectOrder({ data: defaultData });
      await projectOrder.save();
      console.log('Project order data created successfully!');
    }

    console.log('Database populated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error populating database:', error);
    process.exit(1);
  }
}

populateDatabase();


