const fs = require("fs");
const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command } = require("@aws-sdk/client-s3");
require("dotenv").config();

// Check for AWS credentials
const awsAccessKey = process.env.AWS_S3_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID;
const awsSecretKey = process.env.AWS_S3_SECRET_ACESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
const awsRegion = process.env.AWS_REGION || 'ap-south-1';

const s3Client = new S3Client({
  region: awsRegion,
  credentials: (awsAccessKey && awsSecretKey) ? {
    accessKeyId: awsAccessKey,
    secretAccessKey: awsSecretKey,
  } : undefined,
});

if (!awsAccessKey || !awsSecretKey) {
  console.warn('❌ AWS credentials missing! Set AWS_S3_ACCESS_KEY/AWS_ACCESS_KEY_ID and AWS_S3_SECRET_ACESS_KEY/AWS_SECRET_ACCESS_KEY');
  console.warn('Proceeding without credentials (local dev mock responses will be used)');
} else {
  console.log('✅ AWS credentials found, S3Client configured for region:', awsRegion);
}

// Initialize bucket name
const BUCKET = process.env.AWS_S3_BUCKET || "100acress-media-bucket";

// Upload file to S3 with custom folder structure
async function uploadToS3(file, folder = 'uploads') {
  try {
    if (!file || !file.buffer) {
      throw new Error('Invalid file provided');
    }

    // If credentials missing, return a mock for local dev
    if (!awsAccessKey || !awsSecretKey) {
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.originalname}`;
      const mockUrl = `/uploads/${folder}/${fileName}`;
      return { public_id: `${folder}/${fileName}`, url: mockUrl, cdn_url: mockUrl, local: true };
    }

    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.originalname}`;
    const key = `${folder}/${fileName}`;

    const cmd = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });
    await s3Client.send(cmd);

    // If you have CloudFront, replace below with CDN URL build
    const location = `https://${BUCKET}.s3.${awsRegion}.amazonaws.com/${key}`;
    return { public_id: key, url: location, cdn_url: location };
  } catch (error) {
    console.error('Error uploading to S3 (v3):', error);
    throw new Error('Failed to upload file to S3');
  }
}

// Delete file from S3
async function deleteFromS3(publicId) {
  try {
    if (!publicId) throw new Error('Public ID is required for deletion');

    if (!awsAccessKey || !awsSecretKey) {
      console.warn('⚠️ AWS credentials not configured, skipping S3 deletion (mock)');
      return;
    }

    const cmd = new DeleteObjectCommand({ Bucket: BUCKET, Key: publicId });
    await s3Client.send(cmd);
    console.log(`Successfully deleted ${publicId} from S3`);
  } catch (error) {
    console.error('Error deleting from S3 (v3):', error);
    throw new Error('Failed to delete file from S3');
  }
}

// Get file from S3 (for downloading)
async function getFromS3(publicId) {
  try {
    if (!publicId) throw new Error('Public ID is required');
    if (!awsAccessKey || !awsSecretKey) {
      console.warn('⚠️ AWS credentials not configured, cannot retrieve from S3');
      throw new Error('AWS credentials not configured for file retrieval');
    }

    const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: publicId });
    const result = await s3Client.send(cmd);
    // result.Body is a Readable stream in Node.js
    return result.Body;
  } catch (error) {
    console.error('Error getting file from S3 (v3):', error);
    throw new Error('Failed to get file from S3');
  }
}

// Check if AWS is properly configured
function isAWSConfigured() {
  return !!(awsAccessKey && awsSecretKey);
}

// Get AWS configuration status
function getAWSStatus() {
  return {
    configured: isAWSConfigured(),
    region: awsRegion,
    bucket: BUCKET,
    hasAccessKey: !!awsAccessKey,
    hasSecretKey: !!awsSecretKey
  };
}

module.exports = {
  uploadToS3,
  deleteFromS3,
  getFromS3,
  isAWSConfigured,
  getAWSStatus,
  s3Client,
  BUCKET,
  ListObjectsV2Command,
};
