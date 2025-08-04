const ProjectOrderModel = require("../../../models/projectDetail/projectOrder");
const ApiResponse = require("../../../Utilities/ApiResponse");
const ApiError = require("../../../Utilities/ApiError");
const AsyncHandler = require("../../../Utilities/AsyncHandler");

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
      const projectOrders = await ProjectOrderModel.find({});
      
      // Transform data to match Redux structure
      const customOrders = {};
      const buildersWithCustomOrder = {};
      const randomSeeds = {};

      projectOrders.forEach(order => {
        customOrders[order.builderName] = order.customOrder;
        buildersWithCustomOrder[order.builderName] = order.hasCustomOrder;
        if (order.randomSeed) {
          randomSeeds[order.builderName] = order.randomSeed;
        }
      });

      const syncData = {
        customOrders,
        buildersWithCustomOrder,
        randomSeeds
      };

      return res.status(200).json(
        new ApiResponse(200, syncData, "Project orders sync data retrieved successfully")
      );
    } catch (error) {
      throw new ApiError(500, "Error retrieving project orders for sync");
    }
  });
}

module.exports = ProjectOrderController; 