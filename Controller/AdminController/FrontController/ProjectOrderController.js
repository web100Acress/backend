const ProjectOrderModel = require("../../../models/projectDetail/projectOrder");
const ProjectOrder = require("../../../models/ProjectOrder");
const { ApiResponse } = require("../../../Utilities/ApiResponse");
const ApiError = require("../../../Utilities/ApiError");
const AsyncHandler = require("../../../Utilities/AsyncHandler");

// Cache for sync data
let syncCache = null;
let lastSyncCacheTime = 0;
const SYNC_CACHE_TTL = 30 * 1000; // 30 seconds

class ProjectOrderController {
  // Get all project orders
  static getAllProjectOrders = AsyncHandler(async (req, res) => {
    try {
      const projectOrders = await ProjectOrderModel.find({}).sort({ createdAt: -1 });
      
      return res.status(200).json(
        new ApiResponse(200, projectOrders, "Project orders retrieved successfully")
      );
    } catch (error) {
      throw new ApiError(500, "Error retrieving project orders");
    }
  });

  // Get project order by builder name
  static getProjectOrderByBuilder = AsyncHandler(async (req, res) => {
    try {
      const { builderName } = req.params;
      
      if (!builderName) {
        throw new ApiError(400, "Builder name is required");
      }

      const projectOrder = await ProjectOrderModel.findOne({ builderName });
      
      if (!projectOrder) {
        // Return default structure if no order exists
        return res.status(200).json(
          new ApiResponse(200, {
            builderName,
            customOrder: [],
            hasCustomOrder: false,
            randomSeed: null,
            lastUpdated: null,
            updatedBy: null
          }, "No custom order found for this builder")
        );
      }

      return res.status(200).json(
        new ApiResponse(200, projectOrder, "Project order retrieved successfully")
      );
    } catch (error) {
      throw new ApiError(500, "Error retrieving project order");
    }
  });

  // Create or update project order
  static createOrUpdateProjectOrder = AsyncHandler(async (req, res) => {
    try {
      const { builderName, customOrder, hasCustomOrder, randomSeed } = req.body;
      const updatedBy = req.user?.email || "admin";

      if (!builderName) {
        throw new ApiError(400, "Builder name is required");
      }

      // Find existing order or create new one
      let projectOrder = await ProjectOrderModel.findOne({ builderName });

      if (projectOrder) {
        // Update existing order
        projectOrder.customOrder = customOrder || [];
        projectOrder.hasCustomOrder = hasCustomOrder || false;
        projectOrder.randomSeed = randomSeed || null;
        projectOrder.lastUpdated = new Date();
        projectOrder.updatedBy = updatedBy;
      } else {
        // Create new order
        projectOrder = new ProjectOrderModel({
          builderName,
          customOrder: customOrder || [],
          hasCustomOrder: hasCustomOrder || false,
          randomSeed: randomSeed || null,
          updatedBy
        });
      }

      await projectOrder.save();

      return res.status(200).json(
        new ApiResponse(200, projectOrder, "Project order saved successfully")
      );
    } catch (error) {
      throw new ApiError(500, "Error saving project order");
    }
  });

  // Delete project order (reset to random)
  static deleteProjectOrder = AsyncHandler(async (req, res) => {
    try {
      const { builderName } = req.params;
      
      if (!builderName) {
        throw new ApiError(400, "Builder name is required");
      }

      const projectOrder = await ProjectOrderModel.findOneAndDelete({ builderName });
      
      if (!projectOrder) {
        return res.status(200).json(
          new ApiResponse(200, null, "No project order found to delete")
        );
      }

      return res.status(200).json(
        new ApiResponse(200, null, "Project order deleted successfully")
      );
    } catch (error) {
      throw new ApiError(500, "Error deleting project order");
    }
  });

  // Get all project orders for sync (used by frontend)
  static getAllProjectOrdersForSync = AsyncHandler(async (req, res) => {
    try {
      const startTime = Date.now();
      const now = Date.now();
      
      // Check cache first
      if (syncCache && (now - lastSyncCacheTime < SYNC_CACHE_TTL)) {
        console.log(`🚀 Sync cache hit - ${(Date.now() - startTime)}ms`);
        return res.status(200).json(
          new ApiResponse(200, syncCache, "Project orders sync data retrieved successfully (from cache)")
        );
      }

      console.log('🔄 Starting getAllProjectOrdersForSync...');
      
      // Use Promise.all for parallel database queries
      console.log('📦 Fetching data in parallel...');
      const dbStartTime = Date.now();
      
      const [projectOrders, adminProjectOrder] = await Promise.all([
        ProjectOrderModel.find({}).lean().select('builderName customOrder hasCustomOrder randomSeed'),
        ProjectOrder.findOne().lean().select('data')
      ]);
      
      const dbTime = Date.now() - dbStartTime;
      console.log(`🚀 Database queries completed in: ${dbTime}ms`);
      console.log(`✅ Found ${projectOrders.length} project orders`);
      console.log('✅ Admin project order fetched:', adminProjectOrder ? 'found' : 'not found');
      
      // Transform data to match Redux structure
      const customOrders = {};
      const buildersWithCustomOrder = {};
      const randomSeeds = {};

      console.log('🔄 Transforming project orders...');
      projectOrders.forEach(order => {
        customOrders[order.builderName] = order.customOrder;
        buildersWithCustomOrder[order.builderName] = order.hasCustomOrder;
        if (order.randomSeed) {
          randomSeeds[order.builderName] = order.randomSeed;
        }
      });
      console.log('✅ Project orders transformed');

      // Process admin panel data if exists
      if (adminProjectOrder && adminProjectOrder.data) {
        console.log('🔄 Processing admin project orders...');
        Object.keys(adminProjectOrder.data).forEach(statusKey => {
          const statusData = adminProjectOrder.data[statusKey];
          if (Array.isArray(statusData)) {
            customOrders[statusKey] = statusData;
            buildersWithCustomOrder[statusKey] = true;
          }
        });
        console.log('✅ Admin project orders processed');
      }

      const syncData = {
        customOrders,
        buildersWithCustomOrder,
        randomSeeds
      };
      
      // Update cache
      syncCache = syncData;
      lastSyncCacheTime = now;
      
      const totalTime = Date.now() - startTime;
      console.log(`🚀 Total sync time: ${totalTime}ms`);
      console.log('📤 Sending response with ApiResponse...');

      return res.status(200).json(
        new ApiResponse(200, syncData, "Project orders sync data retrieved successfully")
      );
    } catch (error) {
      console.error('❌ Error in getAllProjectOrdersForSync:', error);
      console.error('Error stack:', error.stack);
      throw new ApiError(500, "Error retrieving project orders for sync: " + error.message);
    }
  });
}

module.exports = ProjectOrderController;