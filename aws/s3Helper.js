const fs = require("fs");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
require("dotenv").config();

const REGION = process.env.AWS_REGION || 'ap-south-1';
const BUCKET = process.env.AWS_S3_BUCKET || "100acress-media-bucket";
const ACCESS_KEY = process.env.AWS_S3_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID;
const SECRET_KEY = process.env.AWS_S3_SECRET_ACESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

const s3Client = new S3Client({
  region: REGION,
  credentials: (ACCESS_KEY && SECRET_KEY) ? { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY } : undefined,
});

// Upload a new file to S3. Returns object with Location and Key.
async function uploadFile(file) {
  // Support both disk and memory storage
  const fileContent = file.buffer || await fs.promises.readFile(file.path);
  const Key = `uploads/${Date.now()}-${file.originalname}`;
  const params = { Bucket: BUCKET, Key, Body: fileContent, ContentType: file.mimetype };
  await s3Client.send(new PutObjectCommand(params));
  return { Location: `https://${BUCKET}.s3.${REGION}.amazonaws.com/${Key}`, Key, Bucket: BUCKET };
}

// Update/overwrite an existing object key with a new file
async function updateFile(file, objectKey) {
  const fileContent = file.buffer || await fs.promises.readFile(file.path);
  const Key = objectKey || `uploads/${Date.now()}-${file.originalname}`;
  const params = { Bucket: BUCKET, Key, Body: fileContent, ContentType: file.mimetype };
  await s3Client.send(new PutObjectCommand(params));
  return { Location: `https://${BUCKET}.s3.${REGION}.amazonaws.com/${Key}`, Key, Bucket: BUCKET };
}

// Upload function for memory storage (direct S3 upload without local storage)
async function uploadToS3(file, folder = 'uploads') {
  try {
    console.log('📤 Starting S3 upload for file:', file.originalname);
    const fileContent = file.buffer || await fs.promises.readFile(file.path);
    const Key = `${folder}/${Date.now()}-${file.originalname}`;
    const params = { Bucket: BUCKET, Key, Body: fileContent, ContentType: file.mimetype };

    console.log('🚀 Uploading to S3 (v3) with params:', { Bucket: BUCKET, Key, ContentType: file.mimetype });
    await s3Client.send(new PutObjectCommand(params));

    const Location = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${Key}`;
    console.log('✅ S3 upload successful:', { Location, Key, Bucket: BUCKET });

    return { url: Location, cdn_url: Location, key: Key };
  } catch (error) {
    console.error('❌ S3 upload failed:', error);
    throw error;
  }
}

module.exports = { uploadFile, updateFile, uploadToS3 };
