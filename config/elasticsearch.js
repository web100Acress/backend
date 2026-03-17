// Elasticsearch Configuration for 100acress.com
const { Client } = require('@elastic/elasticsearch');

const ES_CONFIG = {
  node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
  auth: process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD ? {
    username: process.env.ELASTICSEARCH_USERNAME,
    password: process.env.ELASTICSEARCH_PASSWORD
  } : undefined,
  index: '100acress_projects',
  maxRetries: 3,
  requestTimeout: 30000,
  sniffOnStart: true
};

// Create Elasticsearch client
const client = new Client({
  node: ES_CONFIG.node,
  auth: ES_CONFIG.auth,
  maxRetries: ES_CONFIG.maxRetries,
  requestTimeout: ES_CONFIG.requestTimeout
});

// Index mapping for projects
const PROJECT_INDEX_MAPPING = {
  mappings: {
    properties: {
      title: {
        type: 'text',
        fields: {
          keyword: {
            type: 'keyword'
          },
          suggest: {
            type: 'completion'
          }
        }
      },
      description: {
        type: 'text'
      },
      location: {
        type: 'object',
        properties: {
          city: {
            type: 'keyword'
          },
          area: {
            type: 'float'
          },
          pincode: {
            type: 'keyword'
          }
        }
      },
      price: {
        type: 'float'
      },
      propertyType: {
        type: 'keyword'
      },
      bedrooms: {
        type: 'integer'
      },
      bathrooms: {
        type: 'integer'
      },
      area: {
        type: 'float'
      },
      amenities: {
        type: 'keyword'
      },
      status: {
        type: 'keyword'
      },
      builder: {
        type: 'keyword',
        fields: {
          suggest: {
            type: 'completion'
          }
        }
      },
      createdAt: {
        type: 'date'
      },
      updatedAt: {
        type: 'date'
      },
      views: {
        type: 'integer'
      }
    }
  }
};

module.exports = {
  client,
  ES_CONFIG,
  PROJECT_INDEX_MAPPING
};
