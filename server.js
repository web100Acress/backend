const express = require("express");
const compression=require('compression')
const connectDB = require("./db/connect_db");
const router = require("./routes/web");
const Port = process.env.PORT || 3500;
const rateLimit = require("express-rate-limit");
const app = express();
require("dotenv").config();
const cors = require("cors");
const bodyParser = require("body-parser");
const https = require('https');
const http = require('http');
// Add this before your other middleware
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Configure axios or other HTTP clients to ignore certificate errors
https.globalAgent.options.rejectUnauthorized = false;
// var cloudinary = require("cloudinary").v2;

// Create a rate limit rule
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 15 minutes
  max: 250, // Limit each IP to 100 requests per windowMs
  message: "Too many requests , please try again after sometime.",
});

// compress the response 
app.use(compression())


// cors
app.use(cors());

// for storing data into cache and if want to clear cache autometic pass under this SSTDL=time
// const NodeCache=new NodeCache()

// Apply the rate limit rule to all requests
app.use(limiter);

// // cloudinary config
// cloudinary.config({
//   cloud_name: process.env.ClOUDINARY_NAME || 'dm5yrsqdc',
//   //  'dm5yrsqdc',
//   api_key: process.env.ClOUDINARY_API_KEY || '696133393222185',
//   // '696133393222185',
//   api_secret: process.env.ClOUDINARY_API_SECRET || 'nUn6R9b9CA2Bg44sNTWtfRhvVFQ',
//   // 'nUn6R9b9CA2Bg44sNTWtfRhvVFQ',
//   secure: true,
// });

// Middleware for parsing JSON request bodies
app.use(express.json()); // Express's built-in middleware for JSON

// Middleware for parsing URL-encoded form data
app.use(bodyParser.urlencoded({ extended: false }));

// database connection
connectDB();

app.set('trust proxy',1)

// cookie
const cookieParser = require("cookie-parser");
app.use(cookieParser());

// Router Link
app.use("/", router);

app.listen(Port, () => {
  console.log(`App Listen On the ${Port}`);
});

//hi there 