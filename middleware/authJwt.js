const jwt = require('jsonwebtoken');

/**
 * Clean and validate JWT token
 * @param {string} token - The JWT token to clean
 * @returns {string|null} - Cleaned token or null if invalid
 */
const cleanToken = (token) => {
  if (!token || typeof token !== 'string') return null;
  
  // Remove quotes and trim whitespace
  const cleaned = token.replace(/^"|"$|^Bearer\s+/gi, '').trim();
  
  // Basic JWT format validation (3 parts separated by dots)
  const parts = cleaned.split('.');
  if (parts.length !== 3) return null;
  
  return cleaned;
};

/**
 * Verify JWT token with multiple secret fallbacks
 * @param {string} token - The JWT token to verify
 * @param {boolean} [isRefresh=false] - Whether this is a refresh token
 * @returns {object|null} - Decoded token or null if invalid
 */
const verifyJwt = (token, isRefresh = false) => {
  if (!token) return null;
  
  const secret = isRefresh 
    ? process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '-refresh'
    : process.env.JWT_SECRET;
  
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      console.warn('Token expired:', error.expiredAt);
      throw new Error('TOKEN_EXPIRED');
    }
    if (error.name === 'JsonWebTokenError') {
      console.warn('Invalid token:', error.message);
      throw new Error('INVALID_TOKEN');
    }
    console.error('Token verification error:', error);
    throw new Error('TOKEN_VERIFICATION_FAILED');
  }
};

/**
 * Middleware to verify JWT token from various sources
 */
const verifyToken = (req, res, next) => {
  try {
    // Try to get token from different sources
    let token = (
      (req.headers.authorization || '').split(' ')[1] || // Bearer token
      req.query.token ||
      req.cookies?.token ||
      req.body?.token
    );
    
    // Clean and validate token
    token = cleanToken(token);
    if (!token) {
      console.warn('No valid token provided');
      return res.status(401).json({
        success: false,
        error: 'AUTH_REQUIRED',
        message: 'No valid authentication token provided',
        requiresLogin: true
      });
    }
    
    // Verify token
    const decoded = verifyJwt(token);
    if (!decoded || !decoded.userId) {
      throw new Error('INVALID_TOKEN_PAYLOAD');
    }
    
    // Attach user to request
    req.user = decoded;
    if (res.locals) res.locals.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    
    if (error.message === 'TOKEN_EXPIRED') {
      return res.status(401).json({
        success: false,
        error: 'TOKEN_EXPIRED',
        message: 'Your session has expired. Please log in again.',
        requiresLogin: true
      });
    }
    
    if (['INVALID_TOKEN', 'INVALID_TOKEN_PAYLOAD'].includes(error.message)) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid or malformed authentication token',
        requiresLogin: true
      });
    }
    
    return res.status(401).json({
      success: false,
      error: 'AUTHENTICATION_FAILED',
      message: 'Failed to authenticate token',
      requiresLogin: true
    });
  }
};

// Check if user is authenticated
const isAuthenticated = (req, res, next) => {
  verifyToken(req, res, (err) => {
    if (err) return next(err);
    next();
  });
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  verifyToken(req, res, (err) => {
    if (err) return next(err);
    if (['admin', 'superadmin'].includes(req.user?.role)) return next();
    
    console.warn('Admin access denied:', {
      userId: req.user?.userId,
      role: req.user?.role,
      path: req.originalUrl
    });
    
    res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Admin access required'
    });
  });
};

// Check if user is content writer
const isContentWriter = (req, res, next) => {
  verifyToken(req, res, (err) => {
    if (err) return next(err);
    if (['contentwriter', 'admin', 'superadmin'].includes(req.user?.role)) return next();
    
    console.warn('Content writer access denied:', {
      userId: req.user?.userId,
      role: req.user?.role,
      path: req.originalUrl
    });
    
    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Content writer access required'
    });
  });
};

module.exports = {
  verifyToken,
  isAuthenticated,
  isAdmin,
  isContentWriter
};
