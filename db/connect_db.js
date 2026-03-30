const mongoose = require("mongoose");
require("dotenv").config();

const connectDb = () => {
  const mongoUri = process.env.MONGO_URI || 
    "mongodb+srv://amit100acre:Mission2030@cluster0.ffg8qyf.mongodb.net/?retryWrites=true&w=majority";

  const connectionOptions = {
    serverSelectionTimeoutMS: 30000, // 30 seconds timeout
    socketTimeoutMS: 45000, // 45 seconds socket timeout
    bufferCommands: false, // Disable buffering
    maxPoolSize: 10, // Maximum number of sockets in the connection pool
    retryWrites: true,
    w: 'majority'
  };

  return mongoose
    .connect(mongoUri, connectionOptions)
    .then((connectionsDetails) => {
      console.log("✅ Database Connected Successfully");
      console.log(
        "📍 Cluster: ",
        connectionsDetails.connection.host,
        "📊 DB Name:",
        connectionsDetails.connection.name,
      );
      
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
      });
      
      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ MongoDB disconnected');
      });
      
      mongoose.connection.on('reconnected', () => {
        console.log('🔄 MongoDB reconnected');
      });
    })
    .catch((error) => {
      console.error("❌ Database Connection Failed:", error.message);
      console.log("🔄 Retrying connection in 5 seconds...");
      
      // Retry connection after 5 seconds
      setTimeout(() => {
        connectDb();
      }, 5000);
    });
};

module.exports = connectDb;
