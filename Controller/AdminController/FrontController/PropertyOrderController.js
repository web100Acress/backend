const PropertyOrderModel = require("../../../models/property/propertyOrder");
const ApiResponse = require("../../../Utilities/ApiResponse");
const ApiError = require("../../../Utilities/ApiError");
const AsyncHandler = require("../../../Utilities/AsyncHandler");

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

      const order = await PropertyOrderModel.findOne({ builderName });
      if (!order) {
        return res.status(200).json(
          new ApiResponse(
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
          )
        );
      }

      return res
        .status(200)
        .json(new ApiResponse(200, order, "Property order retrieved successfully"));
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
      const orders = await PropertyOrderModel.find({});
      const customOrders = {};
      const buildersWithCustomOrder = {};
      const randomSeeds = {};

      orders.forEach((o) => {
        customOrders[o.builderName] = o.customOrder;
        buildersWithCustomOrder[o.builderName] = o.hasCustomOrder;
        if (o.randomSeed) randomSeeds[o.builderName] = o.randomSeed;
      });

      return res
        .status(200)
        .json(
          new ApiResponse(200, { customOrders, buildersWithCustomOrder, randomSeeds }, "Property orders sync data retrieved")
        );
    } catch (error) {
      throw new ApiError(500, "Error retrieving property orders for sync");
    }
  });
}

module.exports = PropertyOrderController;
