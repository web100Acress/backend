const { ApiError } = require('../Utilities/ApiError');
const logger = require('../Utilities/logger');

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // Log the error
  logger.error(err);

  // MongoDB Errors
  if (err.name === 'CastError') {
    const message = `Resource not found. Invalid: ${err.path}`;
    err = new ApiError(404, message);
  }
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    err = new ApiError(400, `Validation failed: ${messages.join(', ')}`);
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    err = new ApiError(400, `Duplicate field: ${field}`);
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') err = new ApiError(401, 'Invalid token');
  if (err.name === 'TokenExpiredError') err = new ApiError(401, 'Token expired');

  // Send Response
  res.status(err.statusCode).json({
    success: false,
    message: err.message
  });
};

module.exports = errorHandler;