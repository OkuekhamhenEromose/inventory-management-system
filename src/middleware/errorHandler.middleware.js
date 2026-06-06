const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');
const environment = require('../config/environment');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error('Error:', {
    message: error.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    requestId: req.id,
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new ApiError(404, message);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate field value: ${field}. Please use another value.`;
    error = new ApiError(400, message);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new ApiError(400, message);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Token expired');
  }

  const statusCode = error.statusCode || 500;
  
  const response = {
    success: false,
    error: {
      code: statusCode,
      message: error.message || 'Internal Server Error',
    },
  };

  // Add stack trace in development
  if (environment.isDevelopment) {
    response.error.stack = err.stack;
  }

  // Add validation errors if present
  if (error.errors) {
    response.error.errors = error.errors;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;