// Search Microservice for 100acress.com
// Handles all search-related operations independently

const express = require('express');
const cors = require('cors');
const SearchController = require('../Controller/SearchController');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'search-service',
    timestamp: new Date().toISOString()
  });
});

// Search endpoints
app.get('/search', SearchController.advancedSearch);
app.get('/autocomplete', SearchController.autoComplete);
app.get('/filters', SearchController.getFilters);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Search service shutting down...');
  process.exit(0);
});

const PORT = process.env.SEARCH_SERVICE_PORT || 3002;
app.listen(PORT, () => {
  console.log(`🔍 Search service running on port ${PORT}`);
});

module.exports = app;
