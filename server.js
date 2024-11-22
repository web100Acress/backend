const express = require("express");
const mongoose = require("mongoose");
const connectDB = require("./db/connect_db");
const router = require("./routes/web");
const Port = process.env.PORT || 3500;
const rateLimit = require("express-rate-limit");
const app = express();
require("dotenv").config();
const cors = require("cors");
// const connectDb=require("./db/connect_db")
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
var cloudinary = require("cloudinary").v2;

// Create a rate limit rule
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 15 minutes
  max: 250, // Limit each IP to 100 requests per windowMs
  message: "Too many requests , please try again after sometime.",
});
// app.use(compression())

// set template
// app.set('view engine', 'ejs')
// app.use(express.static('public'))

// cors
app.use(cors());

// for storing data into cache and if want to clear cache autometic pass under this SSTDL=time
// const NodeCache=new NodeCache()

// Apply the rate limit rule to all requests
app.use(limiter);

// cloudinary config
cloudinary.config({
  cloud_name: process.env.ClOUDINARY_NAME || 'dm5yrsqdc',
  //  'dm5yrsqdc',
  api_key: process.env.ClOUDINARY_API_KEY || '696133393222185',
  // '696133393222185',
  api_secret: process.env.ClOUDINARY_API_SECRET || 'nUn6R9b9CA2Bg44sNTWtfRhvVFQ',
  // 'nUn6R9b9CA2Bg44sNTWtfRhvVFQ',
  secure: true,
});

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// database connection
connectDB();

// app.get('/',(req,res)=>{
//     res.send("hello")
// })

// cookie
const cookieParser = require("cookie-parser");
app.use(cookieParser());

// Router Link
app.use("/", router);

app.listen(Port, () => {
  console.log(`App Listen On the ${Port}`);
});

//hi there 