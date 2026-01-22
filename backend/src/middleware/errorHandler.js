const winston = require('winston');

/**
 * Enhanced error handling middleware with proper logging
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
  // Default error status and message
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Create error response object
  const errorResponse = {
    error: message,
    code: err.code || 'INTERNAL_ERROR',
    status: status
  };

  // Add request ID if available
  if (req.requestId) {
    errorResponse.requestId = req.requestId;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development' && err.stack) {
    errorResponse.stack = err.stack;
  }

  // Log error with appropriate level
  const logLevel = status >= 500 ? 'error' : 'warn';
  const logMessage = {
    message: message,
    status: status,
    code: err.code,
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent')
  };

  if (status >= 500 && err.stack) {
    logMessage.stack = err.stack;
  }

  // Use winston if available, otherwise console
  if (winston.loggers.has('default')) {
    winston.loggers.get('default')[logLevel](logMessage);
  } else {
    console[logLevel](JSON.stringify(logMessage, null, 2));
  }

  // Send error response
  res.status(status).json(errorResponse);
};

/**
 * Handle 404 - Not Found
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Resource not found',
    code: 'NOT_FOUND',
    path: req.path,
    method: req.method,
    requestId: req.requestId
  });
};

module.exports = { errorHandler, notFoundHandler };
