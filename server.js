const express = require("express");
const compression = require("compression");
const connectDB = require("./db/connect_db");
const router = require("./routes/web");
const Port = process.env.PORT || 3500;
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const bodyParser = require("body-parser");
const errorHandler = require("./middleware/errorMiddleware");
const helmet = require("helmet");
const app = express();
require("dotenv").config();

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://www.googletagmanager.com", "https://connect.facebook.net", "https://snap.licdn.com"],
      connectSrc: ["'self'", "https://api.100acress.com", "https://www.google-analytics.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Create a rate limit rule
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 250, // Limit each IP to 250 requests per windowMs
  message: "Too many requests, please try again after sometime.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Enhanced compression with better options
app.use(compression({
  level: 6, // Higher compression level
  threshold: 1024, // Compress responses larger than 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
}));

// CORS with better configuration
app.use(cors({
  origin: [
    'https://www.100acress.com',
    'https://100acress.com',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Apply the rate limit rule to all requests
app.use(limiter);

// Cache control middleware
app.use((req, res, next) => {
  // Cache static assets for 1 year
  if (req.url.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|webp|avif|woff|woff2|ttf|eot)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  // Cache API responses for 5 minutes
  else if (req.url.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'public, max-age=300');
  }
  // No cache for dynamic content
  else {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  next();
});

app.use(errorHandler);

// Middleware for parsing JSON request bodies with increased limit
app.use(express.json({ limit: "20mb" }));

// Middleware for parsing URL-encoded form data with increased limit
app.use(bodyParser.urlencoded({ extended: false, limit: "20mb" }));

// Database connection
connectDB();

app.set("trust proxy", 1);

// Cookie parser
const cookieParser = require("cookie-parser");
app.use(cookieParser());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Router Link
app.use("/", router);

// Error handling for unhandled routes
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(Port, () => {
  console.log(`App listening on port ${Port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
