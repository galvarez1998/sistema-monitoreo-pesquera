/**
 * Middleware to set request timeout
 * @param {number} timeout - Timeout in milliseconds (default: 30000ms = 30s)
 */
const requestTimeout = (timeout = 30000) => {
  return (req, res, next) => {
    // Set timeout on the request
    req.setTimeout(timeout, () => {
      res.status(408).json({
        error: 'Request timeout',
        code: 'REQUEST_TIMEOUT',
        timeout: `${timeout}ms`
      });
    });

    // Set timeout on the response
    res.setTimeout(timeout, () => {
      res.status(504).json({
        error: 'Gateway timeout',
        code: 'GATEWAY_TIMEOUT',
        timeout: `${timeout}ms`
      });
    });

    next();
  };
};

module.exports = { requestTimeout };
