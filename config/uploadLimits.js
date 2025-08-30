// Environment-specific upload limits
const isDevelopment = process.env.NODE_ENV !== 'production';

const uploadLimits = {
  // File size limits based on environment
  fileSize: isDevelopment 
    ? 50 * 1024 * 1024  // 50MB in development
    : 10 * 1024 * 1024,  // 10MB in production (reduced for better compatibility)
    
  // Maximum files based on environment  
  maxFiles: isDevelopment ? 30 : 20, // Increased from 15 to 20
  
  // Resume file size (always smaller)
  resumeSize: 10 * 1024 * 1024, // 10MB
  
  // Request timeout for large uploads
  timeout: isDevelopment ? 300000 : 180000, // 5min dev, 3min prod (increased)
};

module.exports = uploadLimits;
