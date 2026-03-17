// Elasticsearch Service for 100acress.com
// Production-grade search implementation

const { client } = require('../config/elasticsearch');
const Project = require('../../models/Project');

class ElasticsearchService {
  constructor() {
    this.index = '100acress_projects';
  }

  // Initialize Elasticsearch index
  async initializeIndex() {
    try {
      const exists = await client.indices.exists({ index: this.index });
      
      if (!exists.body) {
        console.log('🔍 Creating Elasticsearch index...');
        await client.indices.create({
          index: this.index,
          body: require('../config/elasticsearch').PROJECT_INDEX_MAPPING
        });
        console.log('✅ Elasticsearch index created successfully');
      }
    } catch (error) {
      console.error('❌ Error initializing Elasticsearch:', error);
      throw error;
    }
  }

  // Index all projects (run once or on updates)
  async indexAllProjects() {
    try {
      console.log('📊 Starting full project indexing...');
      
      const projects = await Project.find({ status: 'active' })
        .lean()
        .maxTime(300000); // 5 minutes timeout
      
      const body = projects.flatMap(project => [
        { index: { _index: this.index } },
        { create: { _index: this.index, _id: project._id.toString() } }
      ]);

      const response = await client.bulk({ body });
      
      if (response.errors) {
        console.error('❌ Indexing errors:', response.items.filter(item => item.index?.error));
      } else {
        console.log(`✅ Indexed ${projects.length} projects successfully`);
      }
      
      return {
        total: projects.length,
        errors: response.errors,
        indexed: response.items.filter(item => !item.index?.error).length
      };
    } catch (error) {
      console.error('❌ Error indexing projects:', error);
      throw error;
    }
  }

  // Advanced search with multiple filters
  async search(query, filters = {}, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'relevance'
      } = options;

      const searchBody = {
        index: this.index,
        size: limit,
        from: (page - 1) * limit,
        sort: this.getSortCriteria(sortBy),
        highlight: {
          fields: {
            title: {},
            description: {},
            'location.city': {}
          }
        },
        query: this.buildQuery(query, filters)
      };

      const response = await client.search(searchBody);
      
      return {
        hits: response.body.hits.hits.map(hit => ({
          _id: hit._id,
          _score: hit._score,
          _source: hit._source,
          highlight: hit.highlight
        })),
        total: response.body.hits.total.value,
        took: response.body.took,
        max_score: response.body.hits.max_score
      };
    } catch (error) {
      console.error('❌ Elasticsearch search error:', error);
      throw error;
    }
  }

  // Build Elasticsearch query
  buildQuery(query, filters) {
    const must = [];
    
    // Text search
    if (query) {
      must.push({
        multi_match: {
          query: query,
          fields: ['title^3', 'description^2', 'location.city^2', 'builder.name^2'],
          fuzziness: 'AUTO'
        }
      });
    }

    // Location filter
    if (filters.location) {
      must.push({
        term: {
          'location.city': filters.location.toLowerCase()
        }
      });
    }

    // Price range filter
    if (filters.priceMin || filters.priceMax) {
      const priceRange = {};
      if (filters.priceMin) priceRange.gte = parseFloat(filters.priceMin);
      if (filters.priceMax) priceRange.lte = parseFloat(filters.priceMax);
      
      must.push({
        range: {
          price: priceRange
        }
      });
    }

    // Property type filter
    if (filters.propertyType) {
      must.push({
        term: {
          propertyType: filters.propertyType.toLowerCase()
        }
      });
    }

    // Bedrooms filter
    if (filters.bedrooms) {
      must.push({
        term: {
          bedrooms: parseInt(filters.bedrooms)
        }
      });
    }

    // Area filter
    if (filters.areaMin || filters.areaMax) {
      const areaRange = {};
      if (filters.areaMin) areaRange.gte = parseFloat(filters.areaMin);
      if (filters.areaMax) areaRange.lte = parseFloat(filters.areaMax);
      
      must.push({
        range: {
          area: areaRange
        }
      });
    }

    // Status filter (default to active)
    must.push({
      term: {
        status: 'active'
      }
    });

    return {
      bool: {
        must: must.length > 0 ? must : [{ match_all: {} }]
      }
    };
  }

  // Get sort criteria
  getSortCriteria(sortBy) {
    const sortMap = {
      relevance: [{ _score: { order: 'desc' } }],
      price: [{ price: { order: 'asc' } }],
      newest: [{ createdAt: { order: 'desc' } }],
      popularity: [{ views: { order: 'desc' } }]
    };
    
    return sortMap[sortBy] || sortMap.relevance;
  }

  // Auto-suggestions
  async getSuggestions(query, field = 'location.city') {
    try {
      const response = await client.search({
        index: this.index,
        size: 10,
        body: {
          suggest: {
            [field]: {
            prefix: query,
            completion: {
              field,
              size: 10,
              skip_duplicates: true
            }
          }
        }
        }
      });

      return response.body.suggest[field][0].options.map(option => ({
        text: option.text,
        type: field
      }));
    } catch (error) {
      console.error('❌ Suggestion error:', error);
      return [];
    }
  }

  // Update single project in index
  async updateProject(projectId, updates) {
    try {
      await client.update({
        index: this.index,
        id: projectId,
        body: { doc: updates }
      });
      
      console.log(`✅ Updated project ${projectId} in Elasticsearch`);
    } catch (error) {
      console.error('❌ Error updating project:', error);
      throw error;
    }
  }

  // Delete project from index
  async deleteProject(projectId) {
    try {
      await client.delete({
        index: this.index,
        id: projectId
      });
      
      console.log(`✅ Deleted project ${projectId} from Elasticsearch`);
    } catch (error) {
      console.error('❌ Error deleting project:', error);
      throw error;
    }
  }

  // Get search analytics
  async getSearchAnalytics(query, timeRange = '24h') {
    try {
      const response = await client.search({
        index: this.index,
        size: 0,
        body: {
          aggs: {
            searches: {
              date_histogram: {
                field: 'createdAt',
                calendar_interval: '1h'
              }
            },
            top_queries: {
              terms: {
                field: 'search_query.keyword',
                size: 10
              }
            }
          }
        }
      });

      return response.body.aggregations;
    } catch (error) {
      console.error('❌ Analytics error:', error);
      throw error;
    }
  }
}

module.exports = new ElasticsearchService();
