const express = require("express");
const path = require("path");
const compression = require("compression");
const helmet = require("helmet");
const connectDB = require("./db/connect_db");
const router = require("./routes/web");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const bodyParser = require("body-parser");
const errorHandler = require("./middleware/errorMiddleware");
const session = require('express-session');
const passport = require('passport');
require('./config/passport'); // Import passport configuration
const cookieParser = require("cookie-parser");

const app = express();

// Load environment variables BEFORE using them
require("dotenv").config();
// Resolve port: prefer PORT env var; default to 3500
const isProd = (process.env.NODE_ENV || "").toLowerCase() === "production";
const Port = Number(process.env.PORT) || 3500;
const http = require("http");
const { Server } = require("socket.io");

// Create a rate limit rule
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 250, // Limit each IP to 250 requests per windowMs
  message: "Too many requests, please try again after sometime.",
});

// CORS configuration - must be one of the first middlewares
// Track seen origins to avoid noisy repeated logs in development
const seenCorsOrigins = new Set();
const corsOptions = {
  origin: function (origin, callback) {
    // Define allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://100acress.com',
      ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
      ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) : [])
    ];

    // In development, allow all origins and log only when header is present
    if (process.env.NODE_ENV !== 'production') {
      if (origin && !seenCorsOrigins.has(origin)) {
        console.log('Allowing CORS for origin:', origin);
        seenCorsOrigins.add(origin);
      }
      return callback(null, true);
    }
    
    // In production, only allow specific origins
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    
    // Block requests from disallowed origins in production
    console.warn('CORS: Blocked request from origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'X-Requested-With',
    'Origin',
    'X-Auth-Token',
    'X-Requested-With',
    'X-HTTP-Method-Override',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Credentials',
    'Access-Control-Allow-Headers'
  ],
  credentials: true,
  optionsSuccessStatus: 204,
  exposedHeaders: [
    'Authorization',
    'set-cookie',
    'access-control-allow-origin',
    'access-control-allow-credentials'
  ],
  preflightContinue: false,
  maxAge: 1728000 // 20 days
};

// Apply CORS before other middlewares
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Handle preflight requests
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    try {
      const origin = req.headers.origin || '*';
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Vary', 'Origin');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Origin');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Max-Age', '86400');
      return res.status(204).end();
    } catch (error) {
      console.error('Error handling preflight:', error);
      return res.status(500).end();
    }
  }
  next();
});

// Security middleware - must come first
// In development, disable COOP to avoid postMessage warnings from third-party iframes/popups
app.use(helmet({
  crossOriginOpenerPolicy: isProd ? { policy: 'same-origin' } : false,
  crossOriginEmbedderPolicy: isProd ? true : false,
  crossOriginResourcePolicy: isProd ? { policy: 'same-origin' } : { policy: 'cross-origin' },
  contentSecurityPolicy: isProd ? undefined : false,
}));
app.use(compression());

// Trust first proxy (important for secure cookies in production)
app.set('trust proxy', 1);

// Configure CORS with the options
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser middleware (must be before routes so req.cookies is available)
app.use(cookieParser());

// Session store: use Redis if REDIS_URL is set, otherwise fall back to in-memory store
let sessionStore;
if (process.env.REDIS_URL) {
  try {
    const RedisStore = require('connect-redis').default;
    const { createClient } = require('redis');
    const redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    // Connect in background
    redisClient.connect().catch((err) => console.error('Redis connect error:', err));
    sessionStore = new RedisStore({ client: redisClient });
    console.log('Session store: RedisStore enabled');
  } catch (err) {
    console.warn('connect-redis/redis not available; falling back to MemoryStore. Reason:', err?.message);
    sessionStore = new session.MemoryStore();
  }
} else {
  sessionStore = new session.MemoryStore();
  console.log('Session store: MemoryStore (no REDIS_URL)');
}

// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    domain: process.env.COOKIE_DOMAIN || undefined
  },
  store: sessionStore
};

// Session middleware
app.use(session(sessionConfig));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Security headers
app.use((req, res, next) => {
  // Security headers
  // Allow embedding on same-origin to support iframes (e.g., YouTube) within our app
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // In development explicitly disable COOP to avoid blocking postMessage
  if (!isProd) {
    res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
  } else {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  }
  
  // Content Security Policy
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self'; " +
      "connect-src 'self' https://*.googleapis.com;"
    );
  }
  
  next();
});

// Apply rate limiting
app.use(limiter);

// Error handling middleware
app.use(errorHandler);

// Database connection
connectDB();

// API routes
app.use('/api', router);


// Serve uploaded files statically so avatar URLs like /uploads/<file> work
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Error handling for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: 'The requested resource was not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'INVALID_TOKEN',
      message: 'Invalid or expired authentication token',
      requiresLogin: true
    });
  }
  
  // Handle other errors
  res.status(err.status || 500).json({
    success: false,
    error: err.code || 'SERVER_ERROR',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message
  });
});

// Create HTTP server and bind Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  },
});

// Make io available inside routes via req.app.get('io')
app.set("io", io);

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  
  socket.on("disconnect", (reason) => {
    console.log(`Socket disconnected (${socket.id}):`, reason);
  });
  
  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
});

// Start the server
server.listen(Port, () => {
  console.log(`
  ==============================================
  🚀 Server is running in ${process.env.NODE_ENV || 'development'} mode
  🌐 Listening on port ${Port}
  📎 API Base URL: http://localhost:${Port}/api
  ==============================================
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle SIGTERM (for Docker/Heroku)
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});
