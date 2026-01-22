const crypto = require('crypto');

/**
 * Middleware to add correlation ID to requests for distributed tracing
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const requestId = (req, res, next) => {
  // Use existing request ID from header or generate new one
  const id = req.headers['x-request-id'] || crypto.randomUUID();
  
  req.requestId = id;
  res.setHeader('X-Request-ID', id);
  
  next();
};

module.exports = { requestId };
