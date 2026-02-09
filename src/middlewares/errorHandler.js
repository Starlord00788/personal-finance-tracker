/**
 * Global error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error Stack:', err.stack);
  
  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = null;
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.values(err.errors).map(val => val.message);
  }
  
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }
  
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }
  
  // PostgreSQL specific errors
  if (err.code === '23505') { // Unique violation
    statusCode = 409;
    message = 'Resource already exists';
  }
  
  if (err.code === '23503') { // Foreign key violation
    statusCode = 400;
    message = 'Invalid reference - related resource not found';
  }
  
  if (err.code === '23502') { // Not null violation
    statusCode = 400;
    message = 'Required field is missing';
  }
  
  if (err.code === '42703') { // Undefined column
    statusCode = 400;
    message = 'Invalid field specified';
  }
  
  // Don't leak error details in production
  const response = {
    success: false,
    message,
    ...(statusCode === 400 && errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err
    })
  };
  
  // Log error details for debugging
  console.error(`❌ ${req.method} ${req.path} - ${statusCode} - ${message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error('Request body:', req.body);
    console.error('Request params:', req.params);
    console.error('Request query:', req.query);
  }
  
  res.status(statusCode).json(response);
};

module.exports = errorHandler;