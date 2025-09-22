class PriceTrendsController {
  // Get all price trends data
  static getAllPriceTrends = async (req, res) => {
    try {
      const PriceTrend = require('../../models/PriceTrend');

      const priceTrends = await PriceTrend.find()
        .sort({ createdAt: -1 })
        .populate('createdBy', 'name email');

      res.status(200).json({
        success: true,
        data: priceTrends
      });
    } catch (error) {
      console.error('Error fetching price trends:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  // Add new price trend
  static addPriceTrend = async (req, res) => {
    try {
      const { area, price, rental, trend } = req.body;

      if (!area || !price || !rental || !trend) {
        return res.status(400).json({
          success: false,
          message: 'Area, price, rental, and trend are required'
        });
      }

      const PriceTrend = require('../../models/PriceTrend');
      const priceTrend = new PriceTrend({
        area,
        price,
        rental,
        trend,
        createdBy: req.user?.id || req.user?._id || '64f8b8c9e4b0a123456789ab'
      });

      await priceTrend.save();

      res.status(201).json({
        success: true,
        message: 'Price trend added successfully',
        data: priceTrend
      });
    } catch (error) {
      console.error('Error adding price trend:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  // Update price trend
  static updatePriceTrend = async (req, res) => {
    try {
      const { id } = req.params;
      const { area, price, rental, trend } = req.body;

      const PriceTrend = require('../../models/PriceTrend');
      const priceTrend = await PriceTrend.findById(id);

      if (!priceTrend) {
        return res.status(404).json({
          success: false,
          message: 'Price trend not found'
        });
      }

      // Update fields
      if (area) priceTrend.area = area;
      if (price) priceTrend.price = price;
      if (rental) priceTrend.rental = rental;
      if (trend) priceTrend.trend = trend;

      await priceTrend.save();

      res.status(200).json({
        success: true,
        message: 'Price trend updated successfully',
        data: priceTrend
      });
    } catch (error) {
      console.error('Error updating price trend:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  // Delete price trend
  static deletePriceTrend = async (req, res) => {
    try {
      const { id } = req.params;

      const PriceTrend = require('../../models/PriceTrend');
      const priceTrend = await PriceTrend.findById(id);

      if (!priceTrend) {
        return res.status(404).json({
          success: false,
          message: 'Price trend not found'
        });
      }

      await PriceTrend.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: 'Price trend deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting price trend:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  // Get price trends by locality/area
  static getPriceTrendsByArea = async (req, res) => {
    try {
      const { area } = req.params;

      const PriceTrend = require('../../models/PriceTrend');
      const priceTrends = await PriceTrend.find({
        area: { $regex: area, $options: 'i' }
      }).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: priceTrends
      });
    } catch (error) {
      console.error('Error fetching price trends by area:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
}

module.exports = PriceTrendsController;
