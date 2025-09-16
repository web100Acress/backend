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
// Resolve port: in non-production, always bind to 3500 to match frontend
const isProd = (process.env.NODE_ENV || "").toLowerCase() === "production";
const Port = isProd ? (process.env.PORT || 3500) : 3500;
const http = require("http");
const { Server } = require("socket.io");

// Create a rate limit rule
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 250, // Limit each IP to 250 requests per windowMs
  message: "Too many requests, please try again after sometime.",
  standardHeaders: true,
  legacyHeaders: false,
  // Do not rate limit heavy, authenticated admin uploads to avoid blocking legitimate actions
  skip: (req) => {
    try {
      const p = (req.originalUrl || req.url || '').toLowerCase();
      const m = (req.method || '').toUpperCase();
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

// Increase request size limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));

// CORS - explicitly allow PATCH + Authorization and handle OPTIONS preflight
const allowedOrigins = (process.env.CORS_ORIGIN || "*")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
      return cb(null, true);
    }
    return cb(null, false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  // Allow common headers; if browser sends more, our manual OPTIONS handler will echo them
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With", "Origin"],
  credentials: true,
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Immediately answer preflight to avoid any interference (rate limits, auth, etc.)
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    try {
      const origin = req.headers.origin || "*";
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Vary", "Origin");
      res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
      const reqHeaders = req.headers["access-control-request-headers"];
      if (reqHeaders) {
        res.header("Access-Control-Allow-Headers", reqHeaders);
      } else {
        res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, X-Requested-With, Origin");
      }
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Max-Age", "86400");
    } catch {}
    return res.sendStatus(204);
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
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware - should be after all other middleware and routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Create HTTP server and bind Socket.IO with timeout configuration
const server = http.createServer(app);

// Set server timeout for large file uploads
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