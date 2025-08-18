const express = require("express");
const compression = require("compression");
const connectDB = require("./db/connect_db");
const router = require("./routes/web");
const Port = process.env.PORT || 3500;
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const bodyParser = require("body-parser");
const errorHandler = require("./middleware/errorMiddleware");
const app = express();
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");

// Create a rate limit rule
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 250, // Limit each IP to 250 requests per windowMs
  message: "Too many requests, please try again after sometime.",
});

// compress the response
app.use(compression());

// cors
app.use(cors());

// Apply the rate limit rule to all requests
app.use(limiter);

app.use(errorHandler);

// Middleware for parsing JSON request bodies
app.use(express.json({limit:"20mb"})); // Express's built-in middleware for JSON

// Middleware for parsing URL-encoded form data
app.use(bodyParser.urlencoded({ extended: false ,limit:"20mb"}));

// database connection
connectDB();

app.set("trust proxy", 1);

// cookie
const cookieParser = require("cookie-parser");
app.use(cookieParser());

// Router Link
app.use("/", router);

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

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  socket.on("disconnect", () => console.log("Socket disconnected:", socket.id));
});

server.listen(Port, () => {
  console.log(`App Listen On the ${Port}`);
});
