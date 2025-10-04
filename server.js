const express = require("express");
const path = require("path");
const compression = require("compression");
const connectDB = require("./db/connect_db");
const router = require("./routes/web");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const bodyParser = require("body-parser");
const errorHandler = require("./middleware/errorMiddleware");
const uploadLimits = require("./config/uploadLimits");
const app = express();
// Load environment variables BEFORE using them
require("dotenv").config();
const isProd = (process.env.NODE_ENV || "").toLowerCase() === "production";
const Port = isProd ? (process.env.PORT || 3500) : 3500;
const http = require("http");
const { Server } = require("socket.io");

// Create a rate limit rule
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 2000, // Increased limit to 2000 requests per minute
  message: { 
    success: false, 
    message: "Too many requests, please try again after some time." 
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Do not rate limit heavy, authenticated admin uploads and frequently accessed endpoints
  skip: (req) => {
    try {
      const p = (req.originalUrl || req.url || '').toLowerCase();
      const m = (req.method || '').toUpperCase();
      
      // Skip rate limiting for all GET requests
      if (m === 'GET') return true;
      
      // Skip rate limiting for specific POST endpoints
      if (m === 'POST' && (
        p.includes('/project/insert') || 
        p.includes('/builder/insert') || 
        p.includes('/api/project/insert') || 
        p.includes('/api/builder/insert') ||
        p.includes('/project/update') || 
        p.includes('/api/project/update') ||
        p.includes('/career/page/insert')
      )) {
        return true;
      }
      
      // Skip project insert/update and builder insert
      if (
        (m === 'POST' && (p.startsWith('/project/insert') || p.startsWith('/builder/insert') || p.startsWith('/api/project/insert') || p.startsWith('/api/builder/insert')))
        || (m === 'POST' && (p.startsWith('/project/update') || p.startsWith('/api/project/update')))
        || (m === 'POST' && p.includes('/career/page/insert'))
      ) {
        return true;
      }
    } catch {}
    return false;
  },
});

// compress the response
app.use(compression());
// Parse allowed origins from environment variable or use defaults
const allowedOrigins = (process.env.CORS_ORIGIN || "https://100acress.com,https://www.100acress.com,http://localhost:3000,https://api.100acress.com")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Add API domain to allowed origins if not already present
const apiDomain = 'api.100acress.com';
if (!allowedOrigins.includes(apiDomain) && !allowedOrigins.includes(`https://${apiDomain}`)) {
  allowedOrigins.push(`https://${apiDomain}`);
}

const corsOptions = {
  origin: (origin, cb) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return cb(null, true);
    
    // Allow all origins in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('Allowing CORS for development origin:', origin);
      return cb(null, true);
    }
    
    // Normalize the origin to handle www and non-www versions
    const normalizedOrigin = origin
      .replace('http://', '')
      .replace('https://', '')
      .replace('www.', '');
    
    // Check if the origin is allowed
    const isAllowed = allowedOrigins.some(allowed => {
      const normalizedAllowed = allowed
        .replace('http://', '')
        .replace('https://', '')
        .replace('www.', '');
      
      // Allow subdomains of the main domain
      if (normalizedOrigin.endsWith('100acress.com')) {
        return true;
      }
      
      return normalizedOrigin === normalizedAllowed || 
             normalizedOrigin.endsWith(normalizedAllowed);
    });
    
    if (isAllowed || allowedOrigins.includes('*')) {
      return cb(null, true);
    }
    
    console.warn('CORS blocked for origin:', origin, 'Allowed origins:', allowedOrigins);
    return cb(new Error('Not allowed by CORS'));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type", 
    "Authorization", 
    "Accept", 
    "X-Requested-With", 
    "Origin",
    "x-access-token",
    "X-Forwarded-For"
  ],
  exposedHeaders: [
    "Content-Range", 
    "X-Content-Range",
    "X-RateLimit-Limit",
    "X-RateLimit-Remaining",
    "X-RateLimit-Reset"
  ],
  credentials: true,
  maxAge: 3600, // Cache preflight for 1 hour
  optionsSuccessStatus: 204
};

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    
    // Log rate limit headers if present
    const limit = res.getHeader('X-RateLimit-Limit');
    const remaining = res.getHeader('X-RateLimit-Remaining');
    if (limit && remaining) {
      console.log(`  Rate Limit: ${remaining}/${limit} remaining`);
    }
  });
  
  next();
});

// Apply CORS middleware
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Enable preflight for all routes

// Handle preflight requests
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.status(204).end();
  }
  next();
});

// Apply the rate limit rule to all requests
app.use(limiter);

app.use(errorHandler);

// Middleware for parsing JSON request bodies
app.use(express.json({limit:"100mb"})); // Express's built-in middleware for JSON

// Middleware for parsing URL-encoded form data
app.use(bodyParser.urlencoded({ extended: false ,limit:"100mb"}));

// database connection
connectDB();

app.set("trust proxy", 1);

// cookie
const cookieParser = require("cookie-parser");
app.use(cookieParser());

// Router Link
app.use("/", router);

// Serve uploaded files statically so avatar URLs like /uploads/<file> work
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware - should be after all other middleware and routes
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Handle CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'Not allowed by CORS',
      allowedOrigins: allowedOrigins
    });
  }

  // Handle rate limit errors
  if (err.status === 429) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.',
      retryAfter: err.retryAfter || 60 // seconds
    });
  }

  // Handle other errors
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Create HTTP server and bind Socket.IO with timeout configuration
const server = http.createServer(app);
server.timeout = uploadLimits.timeout;
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  },
});

// Make io available inside routes via req.app.get('io')
app.set("io", io);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  socket.on("disconnect", () => console.log("Socket disconnected:", socket.id));
});

server.listen(Port, () => {
  console.log(`App Listen On the ${Port} (env NODE_ENV='${process.env.NODE_ENV || ''}', effective PORT='${Port}')`);
});