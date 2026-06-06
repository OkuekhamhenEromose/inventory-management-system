const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const environment = require('../config/environment');
const { asyncHandler } = require('./asyncHandler.middleware');

/**
 * JWT Authentication Middleware
 */
const authenticate = asyncHandler(async (req, res, next) => {
  let token;

  // Get token from header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized to access this route');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, environment.jwt.secret);
    
    // Attach user to request
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
    };

    next();
  } catch (error) {
    throw new ApiError(401, 'Not authorized to access this route');
  }
});

/**
 * Role-based Authorization Middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Not authorized');
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, 'You do not have permission to perform this action');
    }

    next();
  };
};

module.exports = { authenticate, authorize };