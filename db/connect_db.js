const mongoose = require("mongoose");
require("dotenv").config();

const connectDb = () => {
  return mongoose
    .connect(
      process.env.MONGO_URI ||
        "mongodb+srv://amit100acre:Amit123@cluster0.ffg8qyf.mongodb.net/?retryWrites=true&w=majority",
    )
    .then((connectionsDetails) => {
      console.log("Database Connected");
      console.log(
        "cluster name: ",
        connectionsDetails.connection.host,
        "DB Name:",
        connectionsDetails.connection.name,
      );
    })
    .catch((error) => {
      console.log(error);
    });
};

module.exports = connectDb;
