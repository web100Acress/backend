const fs = require("fs");
const AWS = require("aws-sdk");
require("dotenv").config();

AWS.config.update({
  secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
  accessKeyId: process.env.AWS_S3_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

const uploadFFile = async(file) => {
  // Read the file content
  // console.log(file)
  const fileContent = await fs.promises.readFile(file.path);

  const params = {
    Bucket: "100acress-media-bucket", // You can use environment variables for sensitive data like bucket name
    Key: `uploads/${Date.now()}-${file.originalname}`, // Store the file with a unique name in the 'uploads/' folder
    Body: fileContent,
    ContentType: file.mimetype,
  };

  // Return the promise from s3.upload
  return s3.upload(params).promise();
};
module.exports = uploadFFile;

const updateFEile = async(file, objectKey) => {
  const fileContent = await fs.promises.readFile(file.path);

  const params = {
    Bucket: "100acress-media-bucket", // You can use environment variables for sensitive data like bucket name
    Key: objectKey, // Store the file with a unique name in the 'uploads/' folder
    Body: fileContent,
    ContentType: file.mimetype,
  };

  // Return the promise from s3.upload
  return s3.upload(params).promise();
};
module.exports = updateFEile;
