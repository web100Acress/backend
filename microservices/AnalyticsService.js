// Analytics Microservice for 100acress.com
// Tracks user behavior, conversions, and performance metrics

const express = require('express');
const cors = require('cors');

class AnalyticsService {
  constructor() {
    this.events = [];
    this.metrics = {
      pageViews: 0,
      uniqueVisitors: new Set(),
      conversions: 0,
      avgSessionDuration: 0
    };
  }

  // Track page views
  trackPageView(req, res) {
    try {
      const { page, referrer, userAgent, userId } = req.body;
      
      const event = {
        type: 'page_view',
        page,
        referrer,
        userAgent,
        userId,
        timestamp: new Date(),
        sessionId: this.generateSessionId(req)
      };

      this.events.push(event);
      this.metrics.pageViews++;

      // Real-time dashboard update
      this.broadcastToDashboard('page_view', event);

      res.json({ status: 'tracked', sessionId: event.sessionId });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Track conversions (lead submissions, property inquiries)
  trackConversion(req, res) {
    try {
      const { type, value, propertyId, userId } = req.body;
      
      const conversion = {
        type, // 'lead', 'inquiry', 'booking'
        value,
        propertyId,
        userId,
        timestamp: new Date(),
        sessionId: this.generateSessionId(req)
      };

      this.events.push(conversion);
      this.metrics.conversions++;

      // Real-time conversion alert
      this.broadcastToDashboard('conversion', conversion);

      res.json({ status: 'tracked' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get performance metrics
  getMetrics(req, res) {
    try {
      const { timeRange = '24h' } = req.query;
      
      const filteredEvents = this.filterEventsByTimeRange(timeRange);
      
      const metrics = {
        timeRange,
        pageViews: this.metrics.pageViews,
        uniqueVisitors: this.metrics.uniqueVisitors.size,
        conversions: this.metrics.conversions,
        conversionRate: this.metrics.conversions / this.metrics.pageViews * 100,
        avgSessionDuration: this.calculateAvgSessionDuration(filteredEvents),
        topPages: this.getTopPages(filteredEvents),
        conversionFunnel: this.getConversionFunnel(filteredEvents)
      };

      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Generate session ID
  generateSessionId(req) {
    return req.headers['x-session-id'] || `session_${Date.now()}_${Math.random().toString(36)}`;
  }

  // Filter events by time range
  filterEventsByTimeRange(timeRange) {
    const now = new Date();
    const ranges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    };
    
    const cutoff = new Date(now.getTime() - (ranges[timeRange] || ranges['24h']));
    return this.events.filter(event => event.timestamp > cutoff);
  }

  // Calculate average session duration
  calculateAvgSessionDuration(events) {
    const sessions = new Map();
    
    events.forEach(event => {
      if (!sessions.has(event.sessionId)) {
        sessions.set(event.sessionId, { start: event.timestamp, end: event.timestamp });
      } else {
        sessions.get(event.sessionId).end = event.timestamp;
      }
    });

    const durations = Array.from(sessions.values())
      .map(session => (session.end - session.start) / 1000)
      .filter(duration => duration > 0 && duration < 3600); // Filter out invalid sessions

    return durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
  }

  // Get top pages
  getTopPages(events) {
    const pageCounts = {};
    events.forEach(event => {
      if (event.type === 'page_view') {
        pageCounts[event.page] = (pageCounts[event.page] || 0) + 1;
      }
    });

    return Object.entries(pageCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([page, count]) => ({ page, count }));
  }

  // Get conversion funnel
  getConversionFunnel(events) {
    const funnel = {
      landing: 0,
      search: 0,
      propertyView: 0,
      lead: 0,
      conversion: 0
    };

    events.forEach(event => {
      if (event.type === 'page_view') {
        if (event.page === '/') funnel.landing++;
        if (event.page.includes('/projects')) funnel.search++;
      }
      if (event.type === 'property_view') funnel.propertyView++;
      if (event.type === 'conversion') {
        if (event.type === 'lead') funnel.lead++;
        funnel.conversion++;
      }
    });

    return funnel;
  }

  // Broadcast to real-time dashboard
  broadcastToDashboard(type, data) {
    // Implementation would use Socket.IO or WebSocket
    console.log(`📊 Broadcasting to dashboard: ${type}`, data);
  }
}

// Express app setup
const app = express();
app.use(cors());
app.use(express.json());

app.post('/track/pageview', (req, res) => {
  const analytics = new AnalyticsService();
  analytics.trackPageView(req, res);
});

app.post('/track/conversion', (req, res) => {
  const analytics = new AnalyticsService();
  analytics.trackConversion(req, res);
});

app.get('/metrics', (req, res) => {
  const analytics = new AnalyticsService();
  analytics.getMetrics(req, res);
});

const PORT = process.env.ANALYTICS_SERVICE_PORT || 3003;
app.listen(PORT, () => {
  console.log(`📊 Analytics service running on port ${PORT}`);
});

module.exports = AnalyticsService;
