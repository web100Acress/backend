const express = require('express');
const { getS3File } = require('../Utilities/s3HelperUtility');
const router = express.Router();

// Proxy route for S3 images to bypass CORS issues
router.get('/s3-image/:key(*)', async (req, res) => {
  try {
    const objectKey = req.params.key;
    
    
    if (!objectKey) {
      return res.status(400).json({ error: 'Object key is required' });
    }

    // Try to decode the key if it's double-encoded
    let actualKey = objectKey;
    try {
      const decoded = decodeURIComponent(objectKey);
      if (decoded !== objectKey) {
        actualKey = decoded;
      }
    } catch (e) {
      // Use original key if decoding fails
    }
    
    let readstream, ContentType;
    
    try {
      const result = await getS3File(actualKey);
      readstream = result.readstream;
      ContentType = result.ContentType;
    } catch (error) {
      // If decoded key fails, try original key
      if (actualKey !== objectKey) {
        try {
          const result = await getS3File(objectKey);
          readstream = result.readstream;
          ContentType = result.ContentType;
        } catch (fallbackError) {
          throw error; // Throw original error
        }
      } else {
        throw error;
      }
    }
    
    // Set appropriate headers
    res.set({
      'Content-Type': ContentType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    });

    // Stream the file to the response
    readstream.pipe(res);
    
  } catch (error) {
    console.error('❌ Error proxying S3 image:', error);
    
    // Return a 404 with a fallback image or error message
    res.status(404).json({ 
      error: 'Image not found',
      message: 'The requested image could not be found or accessed',
    });
  }
});

// Alternative route for direct S3 URL conversion
router.get('/convert-s3-url', (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Extract the object key from S3 URL
    const s3UrlPattern = /https:\/\/100acress-media-bucket\.s3\.ap-south-1\.amazonaws\.com\/(.+)/;
    const match = url.match(s3UrlPattern);
    
    if (!match) {
      return res.status(400).json({ error: 'Invalid S3 URL format' });
    }

    const objectKey = match[1];
    const proxyUrl = `${req.protocol}://${req.get('host')}/api/s3-image/${encodeURIComponent(objectKey)}`;
    
    res.json({ proxyUrl });
    
  } catch (error) {
    console.error('Error converting S3 URL:', error);
    res.status(500).json({ error: 'Failed to convert URL' });
  }
});

module.exports = router;
