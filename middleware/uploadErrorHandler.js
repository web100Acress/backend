// Middleware to handle multer upload errors
const uploadErrorHandler = (error, req, res, next) => {
  if (error) {
    console.error('Upload error:', error);
    
    // Handle specific multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File size too large. Please reduce file size and try again.',
        error: 'FILE_SIZE_LIMIT_EXCEEDED'
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        message: 'Too many files. Please reduce the number of files and try again.',
        error: 'FILE_COUNT_LIMIT_EXCEEDED'
      });
    }
    
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        message: 'Unexpected file field. Please check your upload form.',
        error: 'UNEXPECTED_FILE_FIELD'
      });
    }
    
    // Handle custom file filter errors
    if (error.message.includes('File size too large')) {
      return res.status(400).json({
        message: error.message,
        error: 'FILE_SIZE_ERROR'
      });
    }
    
    if (error.message.includes('Only image files')) {
      return res.status(400).json({
        message: error.message,
        error: 'INVALID_FILE_TYPE'
      });
    }
    
    // Generic upload error
    return res.status(400).json({
      message: 'File upload error. Please try again.',
      error: 'UPLOAD_ERROR'
    });
  }
  
  next();
};

module.exports = uploadErrorHandler;
