// Environment-specific upload limits
const isDevelopment = process.env.NODE_ENV !== 'production';

const uploadLimits = {
  // File size limits based on environment
  fileSize: isDevelopment 
    ? 50 * 1024 * 1024  // 50MB per file in development
    : 50 * 1024 * 1024,  // 50MB per file in production
    
  // Maximum files per request (sum across all fields)
  maxFiles: isDevelopment ? 60 : 50,
  
  // Resume file size (always smaller)
  resumeSize: 10 * 1024 * 1024, // 10MB
  
  // Request timeout for large uploads
  timeout: isDevelopment ? 300000 : 600000, // 5min dev, 10min prod
};

module.exports = uploadLimits;
