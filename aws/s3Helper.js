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

// Upload function for memory storage (direct S3 upload without local storage)
async function uploadToS3(file, folder = 'uploads') {
  try {
    console.log('📤 Starting S3 upload for file:', file.originalname);
    console.log('File details:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      hasBuffer: !!file.buffer
    });

    // Use file.buffer for memory storage instead of file.path
    const fileContent = file.buffer;
    console.log('📁 File buffer size:', fileContent.length, 'bytes');

    const params = {
      Bucket: BUCKET,
      Body: fileContent,
      Key: `${folder}/${Date.now()}-${file.originalname}`,
      ContentType: file.mimetype,
    };

    console.log('🚀 Uploading to S3 with params:', {
      Bucket: params.Bucket,
      Key: params.Key,
      ContentType: params.ContentType
    });

    const result = await s3.upload(params).promise();
    
    console.log('✅ S3 upload successful:', {
      Location: result.Location,
      Key: result.Key,
      Bucket: result.Bucket
    });

    return {
      url: result.Location,
      cdn_url: result.Location,
      key: result.Key
    };
  } catch (error) {
    console.error('❌ S3 upload failed:', error);
    throw error;
  }
}

module.exports = { uploadFile, updateFile, uploadToS3 };
