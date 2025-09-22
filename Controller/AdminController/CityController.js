class CityController {
  // Get all cities
  static getAllCities = async (req, res) => {
    try {
      const City = require('../../models/City');

      const cities = await City.find()
        .sort({ category: 1, name: 1 })
        .populate('createdBy', 'name email');

      res.status(200).json({
        success: true,
        data: cities
      });
    } catch (error) {
      console.error('Error fetching cities:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  // Get cities by category
  static getCitiesByCategory = async (req, res) => {
    try {
      const { category } = req.params;

      const City = require('../../models/City');
      const cities = await City.find({ category })
        .sort({ name: 1 })
        .populate('createdBy', 'name email');

      res.status(200).json({
        success: true,
        data: cities
      });
    } catch (error) {
      console.error('Error fetching cities by category:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  // Add new city
  static addCity = async (req, res) => {
    try {
      const { name, category, banner, localities } = req.body;

      if (!name || !category || !banner) {
        return res.status(400).json({
          success: false,
          message: 'Name, category, and banner are required'
        });
      }

      const City = require('../../models/City');
      const city = new City({
        name,
        category,
        banner,
        localities: localities ? localities.split(',').map(loc => loc.trim()).filter(loc => loc) : [],
        createdBy: req.user?.id || req.user?._id || '64f8b8c9e4b0a123456789ab'
      });

      await city.save();

      res.status(201).json({
        success: true,
        message: 'City added successfully',
        data: city
      });
    } catch (error) {
      console.error('Error adding city:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  // Update city
  static updateCity = async (req, res) => {
    try {
      const { id } = req.params;
      const { name, category, banner, localities } = req.body;

      const City = require('../../models/City');
      const city = await City.findById(id);

      if (!city) {
        return res.status(404).json({
          success: false,
          message: 'City not found'
        });
      }

      // Update fields
      if (name) city.name = name;
      if (category) city.category = category;
      if (banner) city.banner = banner;
      if (localities !== undefined) {
        city.localities = localities.split(',').map(loc => loc.trim()).filter(loc => loc);
      }

      await city.save();

      res.status(200).json({
        success: true,
        message: 'City updated successfully',
        data: city
      });
    } catch (error) {
      console.error('Error updating city:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  // Delete city
  static deleteCity = async (req, res) => {
    try {
      const { id } = req.params;

      const City = require('../../models/City');
      const city = await City.findById(id);

      if (!city) {
        return res.status(404).json({
          success: false,
          message: 'City not found'
        });
      }

      await City.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: 'City deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting city:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  // Get city localities
  static getCityLocalities = async (req, res) => {
    try {
      const { id } = req.params;

      const City = require('../../models/City');
      const city = await City.findById(id).select('localities');

      if (!city) {
        return res.status(404).json({
          success: false,
          message: 'City not found'
        });
      }

      res.status(200).json({
        success: true,
        data: city.localities
      });
    } catch (error) {
      console.error('Error fetching city localities:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  // Search cities
  static searchCities = async (req, res) => {
    try {
      const { query } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const City = require('../../models/City');
      const cities = await City.find({
        name: { $regex: query, $options: 'i' }
      }).sort({ name: 1 });

      res.status(200).json({
        success: true,
        data: cities
      });
    } catch (error) {
      console.error('Error searching cities:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
}

module.exports = CityController;
