// Real-time Service for 100acress.com
// Handles live features like lead tracking, notifications

const io = require('socket.io')(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000"
  }
});

class RealTimeService {
  constructor() {
    this.connectedUsers = new Map();
    this.activeLeads = new Map();
  }

  // Handle new user connections
  handleConnection(socket) {
    console.log(`👤 User connected: ${socket.id}`);
    
    // Join user to room based on their interests
    socket.on('join-room', (room) => {
      socket.join(room);
      this.connectedUsers.set(socket.id, { room, joinedAt: new Date() });
    });
  }

  // Track user activity on properties
  trackPropertyView(socket) {
    socket.on('property-view', (propertyId) => {
      console.log(`👁 Property viewed: ${propertyId} by ${socket.id}`);
      
      // Notify other users in same location
      const userRoom = this.connectedUsers.get(socket.id)?.room;
      if (userRoom) {
        socket.to(userRoom).emit('property-activity', {
          type: 'view',
          propertyId,
          userId: socket.id,
          timestamp: new Date()
        });
      }
    });
  }

  // Handle lead generation
  handleLeadSubmission(socket) {
    socket.on('new-lead', (leadData) => {
      console.log(`🎯 New lead: ${JSON.stringify(leadData)}`);
      
      // Save lead to database
      this.saveLeadToDatabase(leadData);
      
      // Notify admin team
      socket.to('admin-room').emit('new-lead-alert', {
        ...leadData,
        timestamp: new Date(),
        source: 'real-time'
      });
    });
  }

  // Save lead to database (mock implementation)
  async saveLeadToDatabase(leadData) {
    try {
      // Implementation would save to MongoDB
      console.log('💾 Saving lead to database...');
      // await Lead.create(leadData);
    } catch (error) {
      console.error('❌ Error saving lead:', error);
    }
  }

  // Handle disconnections
  handleDisconnection(socket) {
    console.log(`👋 User disconnected: ${socket.id}`);
    this.connectedUsers.delete(socket.id);
  }

  // Start the real-time service
  start() {
    io.on('connection', (socket) => {
      this.handleConnection(socket);
      this.trackPropertyView(socket);
      this.handleLeadSubmission(socket);
      
      socket.on('disconnect', () => {
        this.handleDisconnection(socket);
      });
    });

    console.log('⚡ Real-time service started');
  }
}

module.exports = new RealTimeService();
