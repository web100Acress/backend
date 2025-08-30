// Environment-specific upload limits
const isDevelopment = process.env.NODE_ENV !== 'production';

const uploadLimits = {
  // File size limits based on environment
  fileSize: isDevelopment 
    ? 50 * 1024 * 1024  // 50MB in development
    : 10 * 1024 * 1024,  // 10MB in production (increased for project images)
    
  // Maximum files based on environment  
  maxFiles: isDevelopment ? 30 : 15,
  
  // Resume file size (always smaller)
  resumeSize: 10 * 1024 * 1024, // 10MB
  
  // Request timeout for large uploads
  timeout: isDevelopment ? 300000 : 120000, // 5min dev, 2min prod
};

module.exports = uploadLimits;
