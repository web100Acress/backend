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
      console.log('=== CREATE CITY REQUEST ===');
      console.log('Request body:', req.body);
      console.log('Request file:', req.file);
      console.log('Request headers:', req.headers['content-type']);

      const { name, category, localities } = req.body;
      const uploadedBy = req.user.id;

      console.log('Parsed data:');
      console.log('- name:', name);
      console.log('- category:', category);
      console.log('- localities:', localities);
      console.log('- localities type:', typeof localities);

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

      // Parse localities - handle both string and array formats
      let localitiesArray = [];
      if (localities) {
        if (typeof localities === 'string') {
          try {
            // Try to parse as JSON first (new format with objects)
            const parsedLocalities = JSON.parse(localities);
            if (Array.isArray(parsedLocalities)) {
              localitiesArray = parsedLocalities.map(loc => ({
                locality: loc.locality || '',
                zone: loc.zone || 'East',
                rate: parseFloat(loc.rate) || 0,
                change5y: parseFloat(loc.change5y) || 0,
                yield: parseFloat(loc.yield) || 0,
                projectUrl: loc.projectUrl || ''
              }));
            }
          } catch {
            // If JSON parsing fails, treat as comma-separated string (legacy format)
            localitiesArray = localities.split(',').map(l => ({
              locality: l.trim(),
              zone: 'East',
              rate: 0,
              change5y: 0,
              yield: 0
            }));
          }
        } else if (Array.isArray(localities)) {
          // If it's already an array, use it directly (new format)
          localitiesArray = localities.map(loc => ({
            locality: loc.locality || '',
            zone: loc.zone || 'East',
            rate: parseFloat(loc.rate) || 0,
            change5y: parseFloat(loc.change5y) || 0,
            yield: parseFloat(loc.yield) || 0,
            projectUrl: loc.projectUrl || ''
          }));
        }
      }

      const newCity = new City({
        name: name.toLowerCase(),
        category,
        localities: localitiesArray,
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
      console.log('=== UPDATE CITY REQUEST ===');
      console.log('Request body:', req.body);
      console.log('Request file:', req.file);
      console.log('Request params:', req.params);

      const { id } = req.params;
      const { name, category, localities } = req.body;

      console.log('Parsed data:');
      console.log('- id:', id);
      console.log('- name:', name);
      console.log('- category:', category);
      console.log('- localities:', localities);
      console.log('- localities type:', typeof localities);

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

      // Parse localities - handle both string and array formats
      if (localities !== undefined) {
        if (typeof localities === 'string') {
          try {
            // Try to parse as JSON first (new format with objects)
            const parsedLocalities = JSON.parse(localities);
            if (Array.isArray(parsedLocalities)) {
              city.localities = parsedLocalities.map(loc => ({
                locality: loc.locality || '',
                zone: loc.zone || 'East',
                rate: parseFloat(loc.rate) || 0,
                change5y: parseFloat(loc.change5y) || 0,
                yield: parseFloat(loc.yield) || 0,
                projectUrl: loc.projectUrl || ''
              }));
            }
          } catch {
            // If JSON parsing fails, treat as comma-separated string (legacy format)
            city.localities = localities.split(',').map(l => ({
              locality: l.trim(),
              zone: 'East',
              rate: 0,
              change5y: 0,
              yield: 0
            }));
          }
        } else if (Array.isArray(localities)) {
          // If it's already an array, use it directly (new format)
          city.localities = localities.map(loc => ({
            locality: loc.locality || '',
            zone: loc.zone || 'East',
            rate: parseFloat(loc.rate) || 0,
            change5y: parseFloat(loc.change5y) || 0,
            yield: parseFloat(loc.yield) || 0,
            projectUrl: loc.projectUrl || ''
          }));
        } else {
          city.localities = [];
        }
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

  // Get price trends by city (public - no authentication required)
  async getPriceTrendsByCityPublic(req, res) {
    try {
      const { city } = req.params;
      const {
        zone = '',
        type = 'Apartment',
        duration = '5y',
        sort = 'recommended',
        page = 1,
        limit = 10
      } = req.query;

      if (!city) {
        return res.status(400).json({
          success: false,
          message: 'City parameter is required'
        });
      }

      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      const skip = (pageNum - 1) * limitNum;

      // Build query
      let query = {
        city: city,
        isActive: true
      };

      // Add zone filter if provided (Note: zone field doesn't exist in current schema)
      // if (zone && zone !== 'All Zones') {
      //   query.zone = { $regex: zone, $options: 'i' };
      // }

      // Add type filter if provided (Note: type field doesn't exist in current schema)
      // if (type && type !== 'All Types') {
      //   query.type = type;
      // }

      console.log('Public price trends query:', query);

      // Get total count
      const total = await PriceTrends.countDocuments(query);

      // Get paginated results
      let priceTrendsQuery = PriceTrends.find(query).skip(skip).limit(limitNum);

      // Apply sorting
      switch (sort) {
        case 'price_desc':
          priceTrendsQuery = priceTrendsQuery.sort({ price: -1 });
          break;
        case 'price_asc':
          priceTrendsQuery = priceTrendsQuery.sort({ price: 1 });
          break;
        case 'yield_desc':
          priceTrendsQuery = priceTrendsQuery.sort({ rental: -1 });
          break;
        default:
          priceTrendsQuery = priceTrendsQuery.sort({ order: 1, area: 1 });
      }

      const priceTrends = await priceTrendsQuery;

      // If no data found, return sample data for testing
      if (priceTrends.length === 0) {
        console.log('No data found in database, returning sample data for testing');
        const sampleLocalities = [
          {
            id: 'sample_1',
            locality: 'Connaught Place',
            zone: 'Central Delhi',
            rate: 25000,
            change5y: 15.5,
            yield: 4.5,
            type: 'Commercial',
            city: city
          },
          {
            id: 'sample_2',
            locality: 'Karol Bagh',
            zone: 'Central Delhi',
            rate: 18000,
            change5y: 12.3,
            yield: 3.8,
            type: 'Residential',
            city: city
          },
          {
            id: 'sample_3',
            locality: 'Lajpat Nagar',
            zone: 'South Delhi',
            rate: 15000,
            change5y: 8.7,
            yield: 4.2,
            type: 'Residential',
            city: city
          },
          {
            id: 'sample_4',
            locality: 'Dwarka',
            zone: 'South West Delhi',
            rate: 12000,
            change5y: 20.1,
            yield: 4.0,
            type: 'Residential',
            city: city
          },
          {
            id: 'sample_5',
            locality: 'Rohini',
            zone: 'North Delhi',
            rate: 10000,
            change5y: 18.9,
            yield: 3.9,
            type: 'Residential',
            city: city
          }
        ];

        return res.status(200).json({
          success: true,
          data: sampleLocalities,
          total: sampleLocalities.length,
          page: pageNum,
          limit: limitNum,
          totalPages: 1,
          note: 'Sample data - add real data to database for production'
        });
      }

      // Transform data to match frontend expectations
      const localities = priceTrends.map(trend => ({
        id: trend._id,
        locality: trend.area,
        zone: 'Unknown', // Zone field doesn't exist in current schema
        rate: parseFloat(trend.price) || 0,
        change5y: parseFloat(trend.trend) || 0,
        yield: parseFloat(trend.rental) || 0,
        type: 'Apartment', // Type field doesn't exist in current schema
        city: trend.city
      }));

      console.log(`Found ${localities.length} localities for ${city} (public)`);

      res.status(200).json({
        success: true,
        data: localities,
        total: total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      });
    } catch (error) {
      console.error('Error getting public price trends by city:', error);
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

      // Validate required fields
      if (!area || !city) {
        return res.status(400).json({
          success: false,
          message: 'Area and city are required fields'
        });
      }

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

      // Validate required fields if provided
      if (area !== undefined && !area) {
        return res.status(400).json({
          success: false,
          message: 'Area cannot be empty if provided'
        });
      }
      if (city !== undefined && !city) {
        return res.status(400).json({
          success: false,
          message: 'City cannot be empty if provided'
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
