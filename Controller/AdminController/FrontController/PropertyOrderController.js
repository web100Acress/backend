const PropertyOrderModel = require("../../../models/property/propertyOrder");
const { ApiResponse } = require("../../../Utilities/ApiResponse");
const ApiError = require("../../../Utilities/ApiError");
const AsyncHandler = require("../../../Utilities/AsyncHandler");
const { redisClient } = require("../../../config/redis");

class PropertyOrderController {
  // Get all property orders
  static getAllPropertyOrders = AsyncHandler(async (req, res) => {
    try {
      const orders = await PropertyOrderModel.find({}).sort({ createdAt: -1 });
      return res
        .status(200)
        .json(new ApiResponse(200, orders, "Property orders retrieved successfully"));
    } catch (error) {
      throw new ApiError(500, "Error retrieving property orders");
    }
  });

  // Get property order by builder name
  static getPropertyOrderByBuilder = AsyncHandler(async (req, res) => {
    try {
      const { builderName } = req.params;
      if (!builderName) throw new ApiError(400, "Builder name is required");

      const cacheKey = `property_order_builder:${builderName}`;

      // Try to get from Redis cache first
      if (redisClient.isOpen) {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          console.log("⚡ Redis Cache Hit: property_order_builder");
          return res.status(200).json(JSON.parse(cachedData));
        }
      }
      console.log("📦 Redis Cache Miss: Fetching property_order_builder from MongoDB");

      const order = await PropertyOrderModel.findOne({ builderName });
      
      let response;
      if (!order) {
        response = new ApiResponse(
          200,
          {
            builderName,
            customOrder: [],
            hasCustomOrder: false,
            randomSeed: null,
            lastUpdated: null,
            updatedBy: null,
          },
          "No custom property order found for this builder"
        );
      } else {
        response = new ApiResponse(200, order, "Property order retrieved successfully");
      }

      // Cache the data in Redis for 10 minutes (600 seconds)
      if (redisClient.isOpen) {
        await redisClient.setEx(cacheKey, 600, JSON.stringify(response));
        console.log("💾 Property order data cached in Redis");
      }

      return res.status(200).json(response);
    } catch (error) {
      throw new ApiError(500, "Error retrieving property order");
    }
  });

  // Create or update property order
  static createOrUpdatePropertyOrder = AsyncHandler(async (req, res) => {
    try {
      const { builderName, customOrder, hasCustomOrder, randomSeed } = req.body;
      const updatedBy = req.user?.email || "admin";

      if (!builderName) throw new ApiError(400, "Builder name is required");

      let order = await PropertyOrderModel.findOne({ builderName });
      if (order) {
        order.customOrder = customOrder || [];
        order.hasCustomOrder = !!hasCustomOrder;
        order.randomSeed = randomSeed ?? null;
        order.lastUpdated = new Date();
        order.updatedBy = updatedBy;
      } else {
        order = new PropertyOrderModel({
          builderName,
          customOrder: customOrder || [],
          hasCustomOrder: !!hasCustomOrder,
          randomSeed: randomSeed ?? null,
          updatedBy,
        });
      }

      await order.save();

      // Clear the cache for this builder and the sync endpoint
      const cacheKey = `property_order_builder:${builderName}`;
      const syncCacheKey = 'property_orders_sync_all';
      if (redisClient.isOpen) {
        await Promise.all([
          redisClient.del(cacheKey),
          redisClient.del(syncCacheKey)
        ]);
        console.log(`🧹 Cleared property order cache for builder: ${builderName} and sync cache`);
      }

      return res
        .status(200)
        .json(new ApiResponse(200, order, "Property order saved successfully"));
    } catch (error) {
      throw new ApiError(500, "Error saving property order");
    }
  });

  // Delete property order
  static deletePropertyOrder = AsyncHandler(async (req, res) => {
    try {
      const { builderName } = req.params;
      if (!builderName) throw new ApiError(400, "Builder name is required");

      const deleted = await PropertyOrderModel.findOneAndDelete({ builderName });
      
      // Clear the cache for this builder and the sync endpoint
      const cacheKey = `property_order_builder:${builderName}`;
      const syncCacheKey = 'property_orders_sync_all';
      if (redisClient.isOpen) {
        await Promise.all([
          redisClient.del(cacheKey),
          redisClient.del(syncCacheKey)
        ]);
        console.log(`🧹 Cleared property order cache for builder: ${builderName} and sync cache`);
      }

      return res
        .status(200)
        .json(new ApiResponse(200, null, deleted ? "Property order deleted" : "No property order found to delete"));
    } catch (error) {
      throw new ApiError(500, "Error deleting property order");
    }
  });

  // Sync endpoint to fetch all property orders in a compact map format
  static getAllPropertyOrdersForSync = AsyncHandler(async (req, res) => {
    try {
      const cacheKey = 'property_orders_sync_all';

      // Try to get from Redis cache first
      if (redisClient.isOpen) {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          console.log("⚡ Redis Cache Hit: property_orders_sync_all");
          return res.status(200).json(JSON.parse(cachedData));
        }
      }
      console.log("📦 Redis Cache Miss: Fetching property_orders_sync_all from MongoDB");

      const orders = await PropertyOrderModel.find({});
      const customOrders = {};
      const buildersWithCustomOrder = {};
      const randomSeeds = {};

      orders.forEach((o) => {
        customOrders[o.builderName] = o.customOrder;
        buildersWithCustomOrder[o.builderName] = o.hasCustomOrder;
        if (o.randomSeed) randomSeeds[o.builderName] = o.randomSeed;
      });

      const response = new ApiResponse(200, { customOrders, buildersWithCustomOrder, randomSeeds }, "Property orders sync data retrieved");

      // Cache the data in Redis for 5 minutes (300 seconds)
      if (redisClient.isOpen) {
        await redisClient.setEx(cacheKey, 300, JSON.stringify(response));
        console.log("💾 Property orders sync data cached in Redis");
      }

      return res.status(200).json(response);
    } catch (error) {
      throw new ApiError(500, "Error retrieving property orders for sync");
    }
  });
}

module.exports = PropertyOrderController;
