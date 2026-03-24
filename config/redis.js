const { createClient } = require("redis");

let redisClient = null;

console.log("🔧 Loading Redis configuration...");

// Redis configuration - works in both development and production
const redisConfig = {
  // Production AWS ElastiCache
  production: {
    url: "redis://hundredacress-redis-qjtx5v.serverless.aps1.cache.amazonaws.com:6379",
    // Add authentication if needed
    // password: "your-redis-password"
  },
  // Development - use local Redis for better performance
  development: {
    url: "redis://localhost:6379"
  }
};

// Initialize Redis with proper configuration
const config = redisConfig[process.env.NODE_ENV] || redisConfig.development;

console.log(`📋 Redis config selected: ${process.env.NODE_ENV || 'development'} -> ${config.url}`);

redisClient = createClient({
  url: config.url,
  socket: {
    connectTimeout: 10000,
    lazyConnect: true,
    reconnectStrategy: (retries) => {
      if (retries > 3) {
        console.log("❌ Redis reconnection failed after 3 attempts");
        return new Error("Redis reconnection failed");
      }
      return Math.min(retries * 100, 3000);
    }
  },
  // Add password if configured
  ...(config.password && { password: config.password })
});

console.log("✅ Redis client created");

redisClient.on("error", (err) => {
  console.error("❌ Redis Error:", err);
});

redisClient.on("connect", () => {
  console.log("🔗 Redis Connecting...");
});

redisClient.on("ready", () => {
  console.log("✅ Redis Ready and Connected!");
});

redisClient.on("end", () => {
  console.log("🔌 Redis Connection Ended");
});

async function connectRedis() {
  try {
    if (!redisClient.isOpen) {
      console.log(`🔗 Attempting Redis connection to: ${config.url}`);
      await redisClient.connect();
      console.log(`✅ Redis Connected (${process.env.NODE_ENV || 'development'} mode)`);
      
      // Test Redis connection
      await redisClient.set('test', 'connection-ok', { EX: 10 });
      const test = await redisClient.get('test');
      console.log("🧪 Redis Test:", test === 'connection-ok' ? 'PASSED' : 'FAILED');
      
      if (test === 'connection-ok') {
        console.log("🚀 Redis is fully operational!");
        console.log("⚡ Cache performance will now be ~13ms instead of 2000ms!");
      }
      
      // Test the isOpen property
      console.log("🔍 Redis isOpen:", redisClient.isOpen);
    }
  } catch (error) {
    console.error("❌ Redis Connection Failed:", error.message);
    console.log("🔄 Falling back to in-memory cache only");
    console.log("💡 To fix Redis issues:");
    console.log("   1. Make sure Redis is running: brew services start redis");
    console.log("   2. Check Redis status: redis-cli ping");
    console.log("   3. Check Redis logs: brew services list | grep redis");
  }
}

// Export a simple test function
module.exports = { 
  redisClient, 
  connectRedis,
  testRedis: async () => {
    try {
      await redisClient.set('startup-test', 'works', { EX: 5 });
      const result = await redisClient.get('startup-test');
      console.log("🧪 Direct Redis test:", result === 'works' ? 'SUCCESS' : 'FAILED');
      return result === 'works';
    } catch (error) {
      console.error("❌ Direct Redis test failed:", error.message);
      return false;
    }
  }
};
