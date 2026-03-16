const { createClient } = require("redis");

let redisClient = null;

// Only initialize Redis in production
if (process.env.NODE_ENV === "production") {
  redisClient = createClient({
    url: "redis://hundredacress-redis-qjtx5v.serverless.aps1.cache.amazonaws.com:6379"
  });

  redisClient.on("error", (err) => {
    console.error("Redis Error:", err);
  });
} else {
  // Create a dummy client for development
  redisClient = {
    isOpen: false,
    get: async () => null,
    setEx: async () => {},
    del: async () => {},
    connect: async () => {}
  };
}

async function connectRedis() {
  try {
    if (redisClient && !redisClient.isOpen && process.env.NODE_ENV === "production") {
      await redisClient.connect();
      console.log("✅ Redis Connected to Amazon ElastiCache");
    } else if (process.env.NODE_ENV !== "production") {
      console.log("🔧 Redis disabled in development mode");
    }
  } catch (error) {
    console.error("❌ Redis Connection Failed:", error);
  }
}

module.exports = { redisClient, connectRedis };
