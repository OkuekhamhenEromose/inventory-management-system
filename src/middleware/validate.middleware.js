const ApiError = require('../utils/ApiError');

/**
 * Request validation middleware using Joi schemas
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, ''),
      }));

      throw new ApiError(400, 'Validation Error', errors);
    }

    req.body = value;
    next();
  };
};

/**
 * Query parameter validation middleware
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, ''),
      }));

      throw new ApiError(400, 'Invalid query parameters', errors);
    }

    req.query = value;
    next();
  };
};

module.exports = { validate, validateQuery };