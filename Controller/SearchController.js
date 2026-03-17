// Advanced Search Controller for 100acress.com
// Elasticsearch-grade functionality with MongoDB fallback

const Project = require('../../models/Project');
const ElasticsearchService = require('../services/ElasticsearchService');

class SearchController {
  // Advanced search with Elasticsearch + MongoDB fallback
  static async advancedSearch(req, res) {
    const startTime = Date.now();
    
    try {
      const {
        query,
        location,
        priceMin,
        priceMax,
        propertyType,
        bedrooms,
        bathrooms,
        area,
        amenities,
        sortBy = 'relevance',
        page = 1,
        limit = 20
      } = req.query;

      // Try Elasticsearch first
      try {
        const esResults = await ElasticsearchService.search(query, {
          location,
          priceMin,
          priceMax,
          propertyType,
          bedrooms,
          bathrooms,
          area,
          amenities
        }, { page, limit, sortBy });

        // Format Elasticsearch response
        const response = {
          took: esResults.took,
          timed_out: false,
          hits: {
            total: esResults.total,
            max_score: esResults.max_score,
            hits: esResults.hits
          }
        };

        // Log search analytics
        await ElasticsearchService.getSearchAnalytics(query);
        
        console.log(`🔍 Elasticsearch search: ${query} (${esResults.total} results in ${esResults.took}ms)`);
        
        return res.json(response);
      } catch (esError) {
        console.log('⚠️ Elasticsearch failed, falling back to MongoDB');
        
        // Fallback to MongoDB with enhanced query
        const mongoQuery = this.buildMongoQuery(query, {
          location,
          priceMin,
          priceMax,
          propertyType,
          bedrooms,
          bathrooms,
          area,
          amenities
        });

        const projects = await Project.find(mongoQuery)
          .sort(this.getMongoSortCriteria(sortBy))
          .limit(limit * 3) // Get more for pagination
          .skip((page - 1) * limit)
          .lean();

        const response = {
          took: Date.now() - startTime,
          timed_out: false,
          hits: {
            total: await Project.countDocuments(mongoQuery),
            max_score: 1.0,
            hits: projects.map(project => ({
              _id: project._id,
              _score: 1.0,
              _source: project
            }))
          }
        };

        console.log(`📊 MongoDB fallback search: ${query} (${response.hits.total} results in ${response.took}ms)`);
        
        return res.json(response);
      }
    } catch (error) {
      console.error('❌ Search error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Build MongoDB query for fallback
  static buildMongoQuery(query, filters) {
    const mongoQuery = { status: 'active' };

    // Text search
    if (query) {
      mongoQuery.$text = {
        $search: query
      };
    }

    // Location filter
    if (filters.location) {
      mongoQuery['location.city'] = {
        $regex: filters.location,
        $options: 'i'
      };
    }

    // Price range
    if (filters.priceMin || filters.priceMax) {
      mongoQuery.price = {};
      if (filters.priceMin) mongoQuery.price.$gte = parseFloat(filters.priceMin);
      if (filters.priceMax) mongoQuery.price.$lte = parseFloat(filters.priceMax);
    }

    // Property type
    if (filters.propertyType) {
      mongoQuery.propertyType = filters.propertyType.toLowerCase();
    }

    // Bedrooms
    if (filters.bedrooms) {
      mongoQuery.bedrooms = parseInt(filters.bedrooms);
    }

    // Area
    if (filters.area) {
      mongoQuery.area = {};
      if (filters.area.min) mongoQuery.area.$gte = parseFloat(filters.area.min);
      if (filters.area.max) mongoQuery.area.$lte = parseFloat(filters.area.max);
    }

    return mongoQuery;
  }

  // MongoDB sort criteria for fallback
  static getMongoSortCriteria(sortBy) {
    const sortMap = {
      relevance: { score: { $meta: 'textScore' } },
      price: { price: 1 },
      newest: { createdAt: -1 },
      popularity: { views: -1 }
    };
    
    return sortMap[sortBy] || sortMap.relevance;
  }

  // Auto-suggest with Elasticsearch
  static async autoComplete(req, res) {
    try {
      const { query } = req.query;
      
      if (!query || query.length < 2) {
        return res.json({ suggestions: [] });
      }

      const suggestions = await ElasticsearchService.getSuggestions(query, 'location.city');
      
      res.json({ 
        suggestions: suggestions.map(suggestion => ({
          text: suggestion.text,
          type: 'location'
        }))
      });
    } catch (error) {
      console.error('❌ Auto-suggest error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get available filters
  static async getFilters(req, res) {
    try {
      // Get unique values from Elasticsearch
      const response = await ElasticsearchService.search('', {}, { limit: 0 });
      
      // Extract unique filter options (would need aggregations in real ES)
      const filters = {
        locations: ['Gurugram', 'Noida', 'Delhi', 'Mumbai'],
        propertyTypes: ['Apartment', 'Villa', 'Plot', 'Commercial'],
        priceRanges: [
          { label: 'Under 50L', min: 0, max: 5000000 },
          { label: '50L - 1Cr', min: 5000000, max: 10000000 },
          { label: '1Cr - 5Cr', min: 10000000, max: 50000000 },
          { label: '5Cr+', min: 50000000, max: 999999999 }
        ],
        bedroomRanges: ['1', '2', '3', '4', '5+'],
        areaRanges: [
          { label: 'Under 1000', min: 0, max: 1000 },
          { label: '1000-2000', min: 1000, max: 2000 },
          { label: '2000-5000', min: 2000, max: 5000 },
          { label: '5000+', min: 5000, max: 999999 }
        ]
      };

      res.json(filters);
    } catch (error) {
      console.error('❌ Filters error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = SearchController;
