const City = require('../../models/Insight/City');
const PriceTrends = require('../../models/Insight/PriceTrends');
const { uploadToS3, deleteFromS3 } = require('../../aws/s3Config');

class InsightsController {

  // ===== CITY MANAGEMENT =====

  // Get all cities organized by category
  async getAllCities(req, res) {
    try {
      const cities = await City.find({ isActive: true })
        .sort({ order: 1, name: 1 });

      const citiesByCategory = { ncr: [], metro: [], other: [] };

      cities.forEach(city => {
        if (citiesByCategory[city.category]) {
          citiesByCategory[city.category].push({
            id: city._id,
            name: city.name,
            banner: city.banner,
            localities: city.localities || []
          });
        }
      });

      res.status(200).json({
        success: true,
        data: citiesByCategory
      });
    } catch (error) {
      console.error('Error getting cities:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching cities',
        error: error.message
      });
    }
  }

  // Get cities by category
  async getCitiesByCategory(req, res) {
    try {
      const { category } = req.params;
      const cities = await City.find({
        category: category,
        isActive: true
      }).sort({ order: 1, name: 1 });

      res.status(200).json({
        success: true,
        data: cities.map(city => ({
          id: city._id,
          name: city.name,
          banner: city.banner,
          localities: city.localities || []
        }))
      });
    } catch (error) {
      console.error('Error getting cities by category:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching cities',
        error: error.message
      });
    }
  }

  // Create new city
  async createCity(req, res) {
    try {
      const { name, category, localities } = req.body;
      const uploadedBy = req.user.id;

      // Check if city already exists
      const existingCity = await City.findOne({ name: name.toLowerCase() });
      if (existingCity) {
        return res.status(400).json({
          success: false,
          message: 'City with this name already exists'
        });
      }

      // Upload banner image to S3
      let bannerData = null;
      if (req.file) {
        bannerData = await uploadToS3(req.file, 'insights/cities');
      }

      const newCity = new City({
        name: name.toLowerCase(),
        category,
        localities: localities ? localities.split(',').map(l => l.trim()) : [],
        banner: bannerData || null,
        uploadedBy
      });

      await newCity.save();

      res.status(201).json({
        success: true,
        message: 'City created successfully',
        data: {
          id: newCity._id,
          name: newCity.name,
          category: newCity.category,
          banner: newCity.banner,
          localities: newCity.localities
        }
      });
    } catch (error) {
      console.error('Error creating city:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating city',
        error: error.message
      });
    }
  }

  // Update city
  async updateCity(req, res) {
    try {
      const { id } = req.params;
      const { name, category, localities } = req.body;

      const city = await City.findById(id);
      if (!city) {
        return res.status(404).json({
          success: false,
          message: 'City not found'
        });
      }

      // Check if name is being changed and if it already exists
      if (name && name.toLowerCase() !== city.name) {
        const existingCity = await City.findOne({ name: name.toLowerCase() });
        if (existingCity) {
          return res.status(400).json({
            success: false,
            message: 'City with this name already exists'
          });
        }
      }

      // Handle banner update
      if (req.file) {
        // Delete old banner if exists
        if (city.banner?.public_id) {
          await deleteFromS3(city.banner.public_id);
        }

        // Upload new banner
        const bannerData = await uploadToS3(req.file, 'insights/cities');
        city.banner = bannerData;
      }

      // Update other fields
      if (name) city.name = name.toLowerCase();
      if (category) city.category = category;
      if (localities !== undefined) {
        city.localities = localities ? localities.split(',').map(l => l.trim()) : [];
      }

      await city.save();

      res.status(200).json({
        success: true,
        message: 'City updated successfully',
        data: {
          id: city._id,
          name: city.name,
          category: city.category,
          banner: city.banner,
          localities: city.localities
        }
      });
    } catch (error) {
      console.error('Error updating city:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating city',
        error: error.message
      });
    }
  }

  // Delete city
  async deleteCity(req, res) {
    try {
      const { id } = req.params;

      const city = await City.findById(id);
      if (!city) {
        return res.status(404).json({
          success: false,
          message: 'City not found'
        });
      }

      // Delete banner from S3 if exists
      if (city.banner?.public_id) {
        await deleteFromS3(city.banner.public_id);
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
        message: 'Error deleting city',
        error: error.message
      });
    }
  }

  // ===== PRICE TRENDS MANAGEMENT =====

  // Get all price trends
  async getAllPriceTrends(req, res) {
    try {
      const priceTrends = await PriceTrends.find({ isActive: true })
        .sort({ order: 1, city: 1, area: 1 });

      res.status(200).json({
        success: true,
        data: priceTrends.map(trend => ({
          id: trend._id,
          area: trend.area,
          price: trend.price,
          rental: trend.rental,
          trend: trend.trend,
          city: trend.city
        }))
      });
    } catch (error) {
      console.error('Error getting price trends:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching price trends',
        error: error.message
      });
    }
  }

  // Get price trends by city
  async getPriceTrendsByCity(req, res) {
    try {
      const { city } = req.params;
      const priceTrends = await PriceTrends.find({
        city: city,
        isActive: true
      }).sort({ order: 1, area: 1 });

      res.status(200).json({
        success: true,
        data: priceTrends.map(trend => ({
          id: trend._id,
          area: trend.area,
          price: trend.price,
          rental: trend.rental,
          trend: trend.trend
        }))
      });
    } catch (error) {
      console.error('Error getting price trends by city:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching price trends',
        error: error.message
      });
    }
  }

  // Create new price trend
  async createPriceTrend(req, res) {
    try {
      const { area, price, rental, trend, city } = req.body;
      const uploadedBy = req.user.id;

      // Check if price trend already exists for this area and city
      const existingTrend = await PriceTrends.findOne({
        area: area.toLowerCase(),
        city: city.toLowerCase()
      });
      if (existingTrend) {
        return res.status(400).json({
          success: false,
          message: 'Price trend for this area and city already exists'
        });
      }

      const newPriceTrend = new PriceTrends({
        area: area.toLowerCase(),
        price,
        rental,
        trend,
        city: city.toLowerCase(),
        uploadedBy
      });

      await newPriceTrend.save();

      res.status(201).json({
        success: true,
        message: 'Price trend created successfully',
        data: {
          id: newPriceTrend._id,
          area: newPriceTrend.area,
          price: newPriceTrend.price,
          rental: newPriceTrend.rental,
          trend: newPriceTrend.trend,
          city: newPriceTrend.city
        }
      });
    } catch (error) {
      console.error('Error creating price trend:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating price trend',
        error: error.message
      });
    }
  }

  // Update price trend
  async updatePriceTrend(req, res) {
    try {
      const { id } = req.params;
      const { area, price, rental, trend, city } = req.body;

      const priceTrend = await PriceTrends.findById(id);
      if (!priceTrend) {
        return res.status(404).json({
          success: false,
          message: 'Price trend not found'
        });
      }

      // Check if area/city combination is being changed and if it already exists
      if ((area && area.toLowerCase() !== priceTrend.area) ||
          (city && city.toLowerCase() !== priceTrend.city)) {
        const existingTrend = await PriceTrends.findOne({
          area: area ? area.toLowerCase() : priceTrend.area,
          city: city ? city.toLowerCase() : priceTrend.city
        });
        if (existingTrend && existingTrend._id.toString() !== id) {
          return res.status(400).json({
            success: false,
            message: 'Price trend for this area and city already exists'
          });
        }
      }

      // Update fields
      if (area) priceTrend.area = area.toLowerCase();
      if (price !== undefined) priceTrend.price = price;
      if (rental !== undefined) priceTrend.rental = rental;
      if (trend) priceTrend.trend = trend;
      if (city) priceTrend.city = city.toLowerCase();

      await priceTrend.save();

      res.status(200).json({
        success: true,
        message: 'Price trend updated successfully',
        data: {
          id: priceTrend._id,
          area: priceTrend.area,
          price: priceTrend.price,
          rental: priceTrend.rental,
          trend: priceTrend.trend,
          city: priceTrend.city
        }
      });
    } catch (error) {
      console.error('Error updating price trend:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating price trend',
        error: error.message
      });
    }
  }

  // Delete price trend
  async deletePriceTrend(req, res) {
    try {
      const { id } = req.params;

      const priceTrend = await PriceTrends.findById(id);
      if (!priceTrend) {
        return res.status(404).json({
          success: false,
          message: 'Price trend not found'
        });
      }

      await PriceTrends.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: 'Price trend deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting price trend:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting price trend',
        error: error.message
      });
    }
  }
}

module.exports = new InsightsController();
