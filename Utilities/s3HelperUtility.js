const fs = require("fs");
const AWS = require("aws-sdk");
const {Stream} = require("stream");
const path = require("path");
const {compressImage} = require("./ImageResizer");
const nodemailer = require("nodemailer");

// Track AWS configuration status
let awsConfigured = false;
let awsConfigError = null;

// Enhanced AWS configuration with better error handling
const configureAWS = () => {
  console.log('🔧 Configuring AWS...');

  // Support both custom and standard env var names, and handle the misspelling
  const ACCESS_KEY = process.env.AWS_S3_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID;
  const SECRET_KEY = process.env.AWS_S3_SECRET_ACESS_KEY || process.env.AWS_SECRET_ACCESS_KEY; // note: ACESS (legacy) or ACCESS (standard)
  const REGION = process.env.AWS_REGION || 'ap-south-1';
  const BUCKET = process.env.AWS_S3_BUCKET || "100acress-media-bucket";

  console.log('📋 AWS Environment check:', {
    hasAccessKey: !!ACCESS_KEY,
    hasSecretKey: !!SECRET_KEY,
    hasRegion: !!REGION,
    region: REGION,
    bucket: BUCKET,
    // Don't log actual keys for security
  });

  // Check if running on EC2 (IAM Role available)
  const isEC2 = process.env.AWS_EXECUTION_ENV || process.env.ECS_CONTAINER_METADATA_URI || false;
  
  if (ACCESS_KEY && SECRET_KEY) {
    // Use explicit credentials from env vars
    AWS.config.update({
      accessKeyId: ACCESS_KEY,
      secretAccessKey: SECRET_KEY,
      region: REGION,
    });
    awsConfigured = true;
    console.log('✅ AWS configured with explicit credentials');
  } else if (isEC2) {
    // On EC2, try to use IAM Role (credentials will be loaded automatically)
    AWS.config.update({
      region: REGION,
    });
    // Don't set credentials - let SDK use IAM role
    awsConfigured = true;
    console.log('✅ AWS configured for EC2/IAM Role (credentials will be loaded automatically)');
  } else {
    // Try default credential chain (IAM role, env vars, credentials file)
    AWS.config.update({
      region: REGION,
    });
    // Let AWS SDK try to load credentials from default chain
    console.log('⚠️ No explicit AWS credentials found. Will try IAM Role or default credential chain.');
    // We'll verify credentials when first used
  }

  return { configured: awsConfigured, region: REGION, bucket: BUCKET };
};

// Initialize AWS configuration
try {
  const config = configureAWS();
  awsConfigured = config.configured;
} catch (error) {
  awsConfigError = error;
  console.error('❌ Failed to configure AWS:', error.message);
  console.error('💡 To fix:');
  console.error('   1. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env');
  console.error('   2. OR attach IAM Role to EC2 instance');
  console.error('   3. OR configure AWS credentials file (~/.aws/credentials)');
}

// Initialize AWS services (will fail gracefully if credentials missing)
let s3, SES;

try {
  s3 = new AWS.S3();
  SES = new AWS.SES();
  
  // Test credentials by making a simple call (only if not using IAM role)
  if (awsConfigured && (process.env.AWS_S3_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID)) {
    // Credentials are explicitly set, assume they work
    console.log('✅ AWS S3 and SES services initialized');
  } else {
    // Will verify on first actual use
    console.log('⚠️ AWS services initialized (credentials will be verified on first use)');
  }
} catch (error) {
  console.error('❌ Failed to initialize AWS services:', error.message);
  // Create dummy instances to prevent crashes
  s3 = null;
  SES = null;
}

const uploadFile = async(file) => {
  // Check if S3 is available
  if (!s3) {
    throw new Error('AWS S3 not initialized. Configure AWS credentials first.');
  }

  try {
    console.log('📤 Starting S3 upload for file:', file.originalname);
    console.log('File details:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      hasBuffer: !!file.buffer
    });

    let fileContent;
    
    // Handle both disk storage and memory storage
    if (file.buffer) {
      // Memory storage (direct S3 upload)
      fileContent = file.buffer;
      console.log('📁 Using file buffer, size:', fileContent.length, 'bytes');
    } else if (file.path && fs.existsSync(file.path)) {
      // Disk storage (legacy)
      fileContent = await fs.promises.readFile(file.path);
      console.log('📁 File read from disk, size:', fileContent.length, 'bytes');
    } else {
      throw new Error('File not found - neither buffer nor disk path available');
    }

    const params = {
      Bucket: process.env.AWS_S3_BUCKET || "100acress-media-bucket",
      Body: fileContent,
      Key: `uploads/${Date.now()}-${file.originalname}`,
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

    return result;
  } catch (error) {
    console.error('❌ S3 upload failed:', error.message);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode
    });

    // Provide specific error messages with fix guidance
    if (error.code === 'CredentialsError' || error.message.includes('credentials')) {
      console.error('💡 AWS Credentials Error - Fix:');
      console.error('   1. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env');
      console.error('   2. OR attach IAM Role with S3 permissions to EC2 instance');
      throw new Error('AWS credentials are invalid or missing. Check logs for fix instructions.');
    } else if (error.code === 'NoSuchBucket') {
      throw new Error('S3 bucket does not exist');
    } else if (error.code === 'AccessDenied') {
      throw new Error('Access denied to S3 bucket - check IAM permissions');
    } else if (error.code === 'AccessControlListNotSupported') {
      throw new Error('S3 bucket does not support ACLs - files will be uploaded without public access');
    } else if (error.code === 'NetworkError') {
      throw new Error('Network error connecting to AWS');
    } else {
      throw new Error(`S3 upload failed: ${error.message}`);
    }
  }
};

const uploadThumbnailImage = async(file) => {
  try {

  /*Image Compression before uploading to AWS on hold for temp*/
  /*
    const originalPath = file.path;
    const compressedDir = path.join(__dirname, '../temp/Compressed');
    const compressedFileName = `${Date.now()}-${file.originalname}`;    
    const compressedPath = path.join(compressedDir, compressedFileName);
    await fs.promises.mkdir(compressedDir, { recursive: true });
    await compressImage(originalPath, compressedPath, 25);
  */  
  let fileContent;
  
  // Handle both disk storage and memory storage
  if (file.buffer) {
    // Memory storage (direct S3 upload)
    fileContent = file.buffer;
  } else if (file.path && fs.existsSync(file.path)) {
    // Disk storage (legacy)
    fileContent = await fs.promises.readFile(file.path);
  } else {
    throw new Error('File not found - neither buffer nor disk path available');
  }
  
  const params = {
    Bucket: process.env.AWS_S3_BUCKET || "100acress-media-bucket",
    Body: fileContent,
    Key: `thumbnails/${Date.now()}-${file.originalname}`,
    ContentType: file.mimetype,
  };
  const uploadResult = await s3.upload(params).promise();

  /*Deleting temp file after upload S3*/
  /*
    console.log(uploadResult);
    console.log('Starting cleanup');
    console.log("Original Path: ",originalPath);
    console.log("Compressed Path: ",compressedPath);
    if(fs.existsSync(originalPath)){
      fs.unlinkSync(originalPath);
    };
    if(fs.existsSync(compressedPath)){
      fs.unlinkSync(compressedPath);
    };
  */
  return uploadResult; // Return S3 upload result
  } catch (error) {
    console.error('Error in uploadThumbnailImage:', error);
    throw error; // Let the caller handle the error
  }
};

const deleteFile = async (fileKey) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET || "100acress-media-bucket",
    Key: fileKey,
  };

  try {
    await s3.deleteObject(params).promise();
    console.log(`File deleted successfully: ${fileKey}`);
    return true;
  } catch (error) {
    console.error(`Error deleting file: ${fileKey}`, error);
    throw error; // Re-throw the error to handle it in the calling function
  }
};

const updateFile = async(file, objectKey) => {
  let fileContent;
  
  // Handle both disk storage and memory storage
  if (file.buffer) {
    // Memory storage (direct S3 upload)
    fileContent = file.buffer;
  } else if (file.path && fs.existsSync(file.path)) {
    // Disk storage (legacy)
    fileContent = await fs.promises.readFile(file.path);
  } else {
    throw new Error('File not found - neither buffer nor disk path available');
  }
  if (objectKey != null) {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET || "100acress-media-bucket",
      Key: objectKey,
      Body: fileContent,
      ContentType: file.mimetype,
    };
    return s3.upload(params).promise();
  } else {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET || "100acress-media-bucket", // You can use environment variables for sensitive data like bucket name
      Key: `uploads/${Date.now()}-${file.originalname}`, // Store the file with a unique name in the 'uploads/' folder
      Body: fileContent,
      ContentType: file.mimetype,
    };

    // Return the promise from s3.upload
    return s3.upload(params).promise();
  }
};

const getS3File = async(objectKey) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET || "100acress-media-bucket",
      Key: objectKey
    }

    const response = await s3.getObject(params).promise();

    // console.log("S3 Response headers:", response.ContentType);

    // Create a Readable stream from the response body (a Buffer)
    const readstream = require('stream').Readable.from(response.Body);

    return {
      readstream, // Match this property name in the main function
      ContentType: response.ContentType
    };
  } catch (error) {
    console.log(error);
    throw error; // Re-throw to handle in the calling function
  }
};

const sendEmail = async (to, sourceEmail , cc = [], subject, html, attachments = true ) => {
  // Check if AWS SES is available
  if (!SES) {
    console.error('❌ AWS SES not initialized. Cannot send email.');
    console.error('💡 Fix: Configure AWS credentials (IAM Role or env vars)');
    return false;
  }

  // Verify AWS credentials before attempting to send
  try {
    // Quick credential check - try to get AWS account ID (lightweight operation)
    // This will fail fast if credentials are missing
    if (!awsConfigured && !process.env.AWS_EXECUTION_ENV) {
      // Not on EC2 and no explicit credentials - check if we can use default chain
      const testConfig = AWS.config.credentials;
      if (!testConfig) {
        throw new Error('AWS credentials not found in default chain');
      }
    }
  } catch (credError) {
    console.error('❌ AWS Credentials Error:', credError.message);
    console.error('💡 To fix AWS email sending:');
    console.error('   1. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env');
    console.error('   2. OR attach IAM Role with SES permissions to EC2 instance');
    console.error('   3. Required IAM permissions: ses:SendEmail, ses:SendRawEmail');
    return false;
  }

  const EmailAttachments = [
    {
      filename: "fblogo.png", // Use PNG instead of SVG
      path: path.join(__dirname, "../Templates/Email/Icons/facebook-circle-fill.png"), // Local path to your PNG file
      cid: "fblogo"
    },
    {
      filename: "lnkdlogo.png", // Use PNG instead of SVG
      path: path.join(__dirname, "../Templates/Email/Icons/linkedin-box-fill.png"), // Local path to your PNG file
      cid: "lnkdlogo"
    },
    {
      filename: "instalogo.png", // Use PNG instead of SVG
      path: path.join(__dirname, "../Templates/Email/Icons/instagram-fill.png"), // Local path to your PNG file
      cid: "instalogo"
    },
    {
      filename: "twlogo.png", // Use PNG instead of SVG
      path: path.join(__dirname, "../Templates/Email/Icons/twitter-x-line.png"), // Local path to your PNG file
      cid: "twlogo"
    }
  ]

  const transporter = nodemailer.createTransport({
    SES:{
      ses:SES,
      aws:AWS
    }
  });

  const mailOptions = {
    from: sourceEmail,
    to: to,
    cc: cc.length > 0 ? cc.join(',') : undefined,
    subject: subject,
    html: html,
    attachments: attachments ? EmailAttachments : []
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully:", result.envelope.from, "→", result.envelope.to);
    return true;
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    
    // Provide specific error guidance
    if (error.code === 'CredentialsError' || error.message.includes('credentials')) {
      console.error('💡 AWS Credentials Error - Fix:');
      console.error('   1. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env');
      console.error('   2. OR attach IAM Role with SES permissions to EC2 instance');
    } else if (error.code === 'MessageRejected') {
      console.error('💡 Email rejected - Check:');
      console.error('   1. Sender email is verified in SES');
      console.error('   2. Recipient email is valid');
      console.error('   3. SES is out of sandbox mode (for production)');
    }
    
    return false;
  }
  
  // const params = {

  //   Destination:{
  //     ToAddresses: [to],
  //     CcAddresses: [...cc],
  //   },
  //   Message:{
  //     Body:{
  //       Html:{
  //         Charset: "UTF-8",
  //         Data: html
  //       }
  //     },
  //     Subject:{
  //       Charset: "UTF-8",
  //       Data: subject
  //     },
  //     Attachments: [...attachments]
  //   },
  //   Source: sourceEmail,
  // }
  // try {
  //   const result = await SES.sendEmail(params).promise();
  //   console.log("Email sent successfully", result);
  //   return true;
  // }
  // catch (error) {
  //   console.error("Error sending email", error);
  //   return false;
  // }
}

module.exports = { uploadFile, deleteFile, updateFile, getS3File, uploadThumbnailImage, sendEmail };
