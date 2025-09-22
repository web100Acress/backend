const fs = require("fs");
const AWS = require("aws-sdk");
const {Stream} = require("stream");
const path = require("path");
const {compressImage} = require("./ImageResizer");
const nodemailer = require("nodemailer");

// Enhanced AWS configuration with better error handling
const configureAWS = () => {
  console.log('Configuring AWS S3...');

  // Support both custom and standard env var names, and handle the misspelling
  const ACCESS_KEY = process.env.AWS_S3_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID;
  const SECRET_KEY = process.env.AWS_S3_SECRET_ACESS_KEY || process.env.AWS_SECRET_ACCESS_KEY; // note: ACESS (legacy) or ACCESS (standard)
  const REGION = process.env.AWS_REGION;
  const BUCKET = process.env.AWS_S3_BUCKET || "100acress-media-bucket";

  console.log('Environment variables check:', {
    hasAccessKey: !!ACCESS_KEY,
    hasSecretKey: !!SECRET_KEY,
    hasRegion: !!REGION,
    region: REGION,
    bucket: BUCKET
  });

  if (!ACCESS_KEY || !SECRET_KEY) {
    console.error('❌ AWS credentials missing! Set AWS_S3_ACCESS_KEY/AWS_ACCESS_KEY_ID and AWS_S3_SECRET_ACESS_KEY/AWS_SECRET_ACCESS_KEY');
    throw new Error('AWS credentials not configured');
  }

  if (!REGION) {
    console.error('❌ AWS region missing! Please set AWS_REGION');
    throw new Error('AWS region not configured');
  }

  AWS.config.update({
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
    region: REGION,
  });

  console.log('✅ AWS S3 configured successfully');
};

// Initialize AWS configuration
try {
  configureAWS();
} catch (error) {
  console.error('Failed to configure AWS:', error.message);
}

const s3 = new AWS.S3();
const SES = new AWS.SES();

const uploadFile = async(file) => {
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
    console.error('❌ S3 upload failed:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode
    });

    // Provide specific error messages
    if (error.code === 'CredentialsError') {
      throw new Error('AWS credentials are invalid or missing');
    } else if (error.code === 'NoSuchBucket') {
      throw new Error('S3 bucket does not exist');
    } else if (error.code === 'AccessDenied') {
      throw new Error('Access denied to S3 bucket - check permissions');
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
    console.log("Email sent successfully : ", result.envelope.from, result.envelope.to);
    return true;
  } catch (error) {
    console.error("Error sending email", error);
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
