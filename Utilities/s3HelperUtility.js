const fs = require("fs");
const AWS = require("aws-sdk");
AWS.config.update({
  secretAccessKey: process.env.AWS_S3_SECRET_ACESS_KEY,
  accessKeyId: process.env.AWS_S3_ACCESS_KEY,
  region: process.env.AWS_REGION,
});
const s3 = new AWS.S3();
const uploadFile = (file) => {
  const fileContent = fs.readFileSync(file.path);

  const params = {
    Bucket: "100acress-media-bucket",
    Body: fileContent,
    Key: `uploads/${Date.now()}-${file.originalname}`,
    ContentType: file.mimetype,
  };
  return s3.upload(params).promise();
};
const deleteFile = async (fileKey) => {
  const params = {
    Bucket: "100acress-media-bucket",
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

const updateFile = (file, objectKey) => {
  const fileContent = fs.readFileSync(file.path);
  if (objectKey != null) {
    const params = {
      Bucket: "100acress-media-bucket",
      Key: objectKey,
      Body: fileContent,
      ContentType: file.mimetype,
    };
    return s3.upload(params).promise();
  } else {
    const params = {
      Bucket: "100acress-media-bucket", // You can use environment variables for sensitive data like bucket name
      Key: `uploads/${Date.now()}-${file.originalname}`, // Store the file with a unique name in the 'uploads/' folder
      Body: fileContent,
      ContentType: file.mimetype,
    };

    // Return the promise from s3.upload
    return s3.upload(params).promise();
  }
};

module.exports = { uploadFile, deleteFile, updateFile };
