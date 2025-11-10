const ContactCard = require('../models/contactCard/contactCard');
const mongoose = require('mongoose');
require('dotenv').config();

const sampleContactCards = [
  {
    name: "Rajesh Aggarwal",
    email: "rajesh@100acress.com",
    phone: "+91-9876543210",
    company: "100acress.com",
    designation: "CEO & Founder",
    website: "https://100acress.com",
    brandColor: "#3B82F6",
    fontStyle: "modern",
    theme: "light",
    bio: "Leading the real estate revolution with technology and innovation.",
    profile_image_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    company_logo_url: "https://100acress-media-bucket.s3.ap-south-1.amazonaws.com/100acre/logo/red.100acresslogo.webp",
    socialLinks: {
      linkedin: "https://www.linkedin.com/in/rajesh-aggarwal",
      twitter: "https://www.twitter.com/rajeshaggarwal"
    },
    address: {
      street: "Sector 44",
      city: "Gurugram",
      state: "Haryana",
      country: "India",
      zipCode: "122003"
    },
    slug: "rajesh-aggarwal"
  },
  {
    name: "Priya Sharma",
    email: "priya@100acress.com",
    phone: "+91-9876543211",
    company: "100acress.com",
    designation: "Head of Sales",
    website: "https://100acress.com",
    brandColor: "#10B981",
    fontStyle: "elegant",
    theme: "gradient",
    bio: "Passionate about helping clients find their dream properties with personalized service.",
    profile_image_url: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
    company_logo_url: "https://100acress.com/favicon.ico",
    socialLinks: {
      linkedin: "https://www.linkedin.com/in/priya-sharma",
      instagram: "https://www.instagram.com/priyasharma"
    },
    address: {
      street: "DLF Phase 2",
      city: "Gurugram",
      state: "Haryana",
      country: "India",
      zipCode: "122002"
    },
    slug: "priya-sharma"
  },
  {
    name: "Amit Kumar",
    email: "amit@100acress.com",
    phone: "+91-9876543212",
    company: "100acress.com",
    designation: "Property Consultant",
    website: "https://100acress.com",
    brandColor: "#8B5CF6",
    fontStyle: "bold",
    theme: "dark",
    bio: "Expert in luxury properties and investment opportunities in NCR region.",
    profile_image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    company_logo_url: "https://100acress.com/favicon.ico",
    socialLinks: {
      linkedin: "https://www.linkedin.com/in/amit-kumar",
      facebook: "https://www.facebook.com/amitkumar"
    },
    address: {
      street: "Connaught Place",
      city: "New Delhi",
      state: "Delhi",
      country: "India",
      zipCode: "110001"
    },
    slug: "amit-kumar"
  }
];

async function seedContactCards() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGO_URI ||
        "mongodb+srv://amit100acre:Amit123@cluster0.ffg8qyf.mongodb.net/?retryWrites=true&w=majority"
    );

    console.log('Connected to MongoDB');

    // Clear existing contact cards (optional)
    await ContactCard.deleteMany({});
    console.log('Cleared existing contact cards');

    // Insert sample data
    const insertedCards = await ContactCard.insertMany(sampleContactCards);
    console.log(`Inserted ${insertedCards.length} contact cards:`);
    
    insertedCards.forEach(card => {
      console.log(`- ${card.name} (${card.slug}) - ${card.fullUrl}`);
    });

    console.log('\nSample contact card URLs:');
    insertedCards.forEach(card => {
      console.log(`https://100acress.com/hi/${card.slug}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding contact cards:', error);
    process.exit(1);
  }
}

// Run seeder if this file is executed directly
if (require.main === module) {
  seedContactCards();
}

module.exports = { seedContactCards, sampleContactCards };
