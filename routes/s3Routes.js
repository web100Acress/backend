const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const path = require('path');
const crypto = require('crypto');
const router = express.Router();

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-south-1'
});

const BUCKET_NAME = '100acress-media-bucket';

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'), false);
    }
  }
});

// Middleware to verify admin access
const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // Add your JWT verification logic here
  // For now, we'll assume the token is valid
  // In production, verify the JWT and check user role
  
  next();
};

// Get all folders from S3 bucket
router.get('/folders', verifyAdmin, async (req, res) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Delimiter: '/',
    };

    const data = await s3.listObjectsV2(params).promise();
    
    // Extract folder names from CommonPrefixes
    const folders = data.CommonPrefixes.map(prefix => 
      prefix.Prefix.replace('/', '')
    );

    // Add predefined folders if they don't exist
    const predefinedFolders = [
      '100acre',
      'festival-images',
      'insight-banners',
      'insights',
      'placeholder',
      'projectdata',
      'small-banners',
      'spaces',
      'test-uploads',
      'thumbnails',
      'uploads'
    ];

    const allFolders = [...new Set([...folders, ...predefinedFolders])];

    res.json({
      success: true,
      folders: allFolders
    });
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch folders',
      message: error.message
    });
  }
});

// Get images from specific folder
router.get('/images/:folder', verifyAdmin, async (req, res) => {
  try {
    const { folder } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const params = {
      Bucket: BUCKET_NAME,
      Prefix: `${folder}/`,
      Delimiter: '/',
      MaxKeys: parseInt(limit),
    };

    const data = await s3.listObjectsV2(params).promise();
    
    // Filter only image files
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const images = data.Contents
      .filter(item => {
        const ext = path.extname(item.Key).toLowerCase();
        return imageExtensions.includes(ext) && item.Key !== `${folder}/`;
      })
      .map(item => ({
        id: item.ETag.replace(/"/g, ''), // Use ETag as unique ID
        name: path.basename(item.Key),
        key: item.Key,
        url: `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${item.Key}`,
        size: formatFileSize(item.Size),
        lastModified: item.LastModified.toISOString().split('T')[0],
        type: `image/${path.extname(item.Key).substring(1)}`,
        folder: folder
      }));

    res.json({
      success: true,
      images: images,
      total: images.length,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch images',
      message: error.message
    });
  }
});

// Upload multiple images to specific folder
router.post('/upload', verifyAdmin, upload.array('files', 20), async (req, res) => {
  try {
    const { folder } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files provided'
      });
    }

    if (!folder) {
      return res.status(400).json({
        success: false,
        error: 'Folder name is required'
      });
    }

    const uploadPromises = files.map(async (file) => {
      const fileExtension = path.extname(file.originalname);
      const fileName = `${crypto.randomUUID()}${fileExtension}`;
      const key = `${folder}/${fileName}`;

      const uploadParams = {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read', // Make images publicly accessible
        Metadata: {
          'original-name': file.originalname,
          'upload-date': new Date().toISOString(),
          'uploaded-by': 'admin' // You can get this from JWT token
        }
      };

      const result = await s3.upload(uploadParams).promise();
      
      return {
        id: result.ETag.replace(/"/g, ''),
        name: fileName,
        originalName: file.originalname,
        key: key,
        url: result.Location,
        size: formatFileSize(file.size),
        type: file.mimetype,
        folder: folder
      };
    });

    const uploadedFiles = await Promise.all(uploadPromises);

    res.json({
      success: true,
      message: `Successfully uploaded ${uploadedFiles.length} files`,
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload files',
      message: error.message
    });
  }
});

// Delete single image
router.delete('/images/:key(*)', verifyAdmin, async (req, res) => {
  try {
    const key = req.params.key;

    const deleteParams = {
      Bucket: BUCKET_NAME,
      Key: key
    };

    await s3.deleteObject(deleteParams).promise();

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete image',
      message: error.message
    });
  }
});

// Delete multiple images (batch delete)
router.delete('/images/batch', verifyAdmin, async (req, res) => {
  try {
    const { keys } = req.body;

    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Image keys array is required'
      });
    }

    const deleteParams = {
      Bucket: BUCKET_NAME,
      Delete: {
        Objects: keys.map(key => ({ Key: key })),
        Quiet: false
      }
    };

    const result = await s3.deleteObjects(deleteParams).promise();

    res.json({
      success: true,
      message: `Successfully deleted ${result.Deleted.length} images`,
      deleted: result.Deleted,
      errors: result.Errors || []
    });
  } catch (error) {
    console.error('Error batch deleting images:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete images',
      message: error.message
    });
  }
});

// Create new folder
router.post('/folders', verifyAdmin, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Folder name is required'
      });
    }

    // Validate folder name
    const folderName = name.trim().replace(/[^a-zA-Z0-9-_]/g, '-');
    
    // Create a placeholder object to create the folder
    const key = `${folderName}/.placeholder`;
    
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: '',
      ContentType: 'text/plain',
      Metadata: {
        'created-date': new Date().toISOString(),
        'created-by': 'admin'
      }
    };

    await s3.upload(uploadParams).promise();

    res.json({
      success: true,
      message: 'Folder created successfully',
      folder: folderName
    });
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create folder',
      message: error.message
    });
  }
});

// Get presigned URL for direct upload (optional)
router.post('/presigned-url', verifyAdmin, async (req, res) => {
  try {
    const { fileName, fileType, folder } = req.body;

    if (!fileName || !fileType || !folder) {
      return res.status(400).json({
        success: false,
        error: 'fileName, fileType, and folder are required'
      });
    }

    const key = `${folder}/${crypto.randomUUID()}-${fileName}`;
    
    const presignedUrl = s3.getSignedUrl('putObject', {
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: fileType,
      Expires: 300, // 5 minutes
      ACL: 'public-read'
    });

    res.json({
      success: true,
      presignedUrl: presignedUrl,
      key: key,
      publicUrl: `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate presigned URL',
      message: error.message
    });
  }
});

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

module.exports = router;
