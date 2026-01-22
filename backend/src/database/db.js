const { Pool } = require('pg');
require('dotenv').config();

/**
 * PostgreSQL connection pool configuration with best practices
 * - Connection pooling for efficient resource usage
 * - Automatic retry logic for transient failures
 * - Statement timeout to prevent long-running queries
 * - Graceful error handling
 */
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'fishery_monitoring',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: parseInt(process.env.DB_POOL_MAX || '20', 10),
  min: parseInt(process.env.DB_POOL_MIN || '2', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  statement_timeout: 30000, // 30 seconds max query time
  query_timeout: 30000,
});

let isShuttingDown = false;

// Test connection with retry logic
pool.on('connect', (client) => {
  console.log('Database client connected');
  
  // Set statement timeout for this client
  client.query('SET statement_timeout = 30000').catch(err => {
    console.error('Error setting statement timeout:', err);
  });
});

pool.on('error', (err, client) => {
  console.error('Unexpected database error on idle client:', err);
  
  // Don't exit immediately in production - let the pool handle reconnection
  if (process.env.NODE_ENV !== 'production' && !isShuttingDown) {
    console.error('Exiting due to database error (development mode)');
    process.exit(-1);
  }
});

pool.on('remove', () => {
  console.log('Database client removed from pool');
});

/**
 * Execute query with automatic retry for transient errors
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @param {number} retries - Number of retry attempts
 * @returns {Promise} Query result
 */
const queryWithRetry = async (text, params, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      const isLastAttempt = attempt === retries;
      const isTransientError = 
        err.code === 'ECONNREFUSED' ||
        err.code === 'ECONNRESET' ||
        err.code === 'ETIMEDOUT' ||
        err.code === '57P03'; // Connection does not exist

      if (isTransientError && !isLastAttempt) {
        console.warn(`Query failed (attempt ${attempt}/${retries}), retrying...`, err.message);
        // Exponential backoff: 100ms, 200ms, 400ms
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt - 1)));
        continue;
      }
      
      throw err;
    }
  }
};

/**
 * Health check function to verify database connectivity
 * @returns {Promise<boolean>}
 */
const healthCheck = async () => {
  try {
    const result = await pool.query('SELECT NOW() as now, current_database() as database');
    return {
      healthy: true,
      timestamp: result.rows[0].now,
      database: result.rows[0].database,
      poolSize: pool.totalCount,
      idleConnections: pool.idleCount,
      waitingRequests: pool.waitingCount
    };
  } catch (err) {
    return {
      healthy: false,
      error: err.message
    };
  }
};

/**
 * Gracefully close database connections
 * @returns {Promise<void>}
 */
const gracefulShutdown = async () => {
  if (isShuttingDown) {
    return;
  }
  
  isShuttingDown = true;
  console.log('Closing database connections...');
  
  try {
    await pool.end();
    console.log('Database connections closed successfully');
  } catch (err) {
    console.error('Error closing database connections:', err);
    throw err;
  }
};

module.exports = {
  query: queryWithRetry,
  pool,
  healthCheck,
  gracefulShutdown
};
