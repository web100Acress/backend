const fs = require("fs");
const AWS = require("aws-sdk");
require("dotenv").config();

// Check for AWS credentials
const awsAccessKey = process.env.AWS_S3_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID;
const awsSecretKey = process.env.AWS_S3_SECRET_ACESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
const awsRegion = process.env.AWS_REGION || 'ap-south-1';

if (!awsAccessKey || !awsSecretKey) {
  console.warn('❌ AWS credentials missing! Set AWS_S3_ACCESS_KEY/AWS_ACCESS_KEY_ID and AWS_S3_SECRET_ACESS_KEY/AWS_SECRET_ACCESS_KEY');
  console.warn('Failed to configure AWS: AWS credentials not configured');
} else {
  console.log('✅ AWS credentials found, configuring S3...');
  AWS.config.update({
    secretAccessKey: awsSecretKey,
    accessKeyId: awsAccessKey,
    region: awsRegion,
  });
}

// Initialize S3 (will work with or without credentials for local development)
const s3 = new AWS.S3();
const BUCKET = process.env.AWS_S3_BUCKET || "100acress-media-bucket";

// Upload file to S3 with custom folder structure
async function uploadToS3(file, folder = 'uploads') {
  try {
    // Check if AWS credentials are available
    if (!awsAccessKey || !awsSecretKey) {
      console.warn('⚠️ AWS credentials not configured, skipping S3 upload');
      // Return a mock response for local development
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.originalname}`;
      const mockUrl = `/uploads/${folder}/${fileName}`;
      
      return {
        public_id: `${folder}/${fileName}`,
        url: mockUrl,
        cdn_url: mockUrl,
        local: true // Flag to indicate this is a local mock
      };
    }

    if (!file || !file.buffer) {
      throw new Error('Invalid file provided');
    }

    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.originalname}`;
    const key = `${folder}/${fileName}`;

    const params = {
      Bucket: BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    const result = await s3.upload(params).promise();

    return {
      public_id: key,
      url: result.Location,
      cdn_url: result.Location, // You can modify this if you have a CDN setup
    };
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('Failed to upload file to S3');
  }
}

// Delete file from S3
async function deleteFromS3(publicId) {
  try {
    // Check if AWS credentials are available
    if (!awsAccessKey || !awsSecretKey) {
      console.warn('⚠️ AWS credentials not configured, skipping S3 deletion');
      console.log(`Mock deletion of ${publicId} (local development)`);
      return;
    }

    if (!publicId) {
      throw new Error('Public ID is required for deletion');
    }

    const params = {
      Bucket: BUCKET,
      Key: publicId,
    };

    await s3.deleteObject(params).promise();
    console.log(`Successfully deleted ${publicId} from S3`);
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw new Error('Failed to delete file from S3');
  }
}

// Get file from S3 (for downloading)
async function getFromS3(publicId) {
  try {
    // Check if AWS credentials are available
    if (!awsAccessKey || !awsSecretKey) {
      console.warn('⚠️ AWS credentials not configured, cannot retrieve from S3');
      throw new Error('AWS credentials not configured for file retrieval');
    }

    if (!publicId) {
      throw new Error('Public ID is required');
    }

    const params = {
      Bucket: BUCKET,
      Key: publicId,
    };

    const result = await s3.getObject(params).promise();
    return result.Body;
  } catch (error) {
    console.error('Error getting file from S3:', error);
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
  s3,
  BUCKET
};
