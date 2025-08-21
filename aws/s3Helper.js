const fs = require("fs");
const AWS = require("aws-sdk");
require("dotenv").config();

AWS.config.update({
  secretAccessKey: process.env.AWS_S3_SECRET_ACESS_KEY,
  accessKeyId: process.env.AWS_S3_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();
const BUCKET = process.env.AWS_S3_BUCKET || "100acress-media-bucket";

// Upload a new file to S3. Returns AWS SDK upload result with Location URL.
async function uploadFile(file) {
  const fileContent = await fs.promises.readFile(file.path);
  const params = {
    Bucket: BUCKET,
    Key: `uploads/${Date.now()}-${file.originalname}`,
    Body: fileContent,
    ContentType: file.mimetype,
  };
  return s3.upload(params).promise();
}

// Update/overwrite an existing object key with a new file
async function updateFile(file, objectKey) {
  const fileContent = await fs.promises.readFile(file.path);
  const params = {
    Bucket: BUCKET,
    Key: objectKey,
    Body: fileContent,
    ContentType: file.mimetype,
  };
  return s3.upload(params).promise();
}

module.exports = { uploadFile, updateFile };
