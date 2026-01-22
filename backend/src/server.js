const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import configurations and middleware
const { validateEnv } = require('./config/env');
const configureLogger = require('./config/logger');
const { requestId } = require('./middleware/requestId');
const { requestTimeout } = require('./middleware/timeout');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const db = require('./database/db');

// Validate environment variables on startup
try {
  validateEnv();
  console.log('✓ Environment variables validated successfully');
} catch (err) {
  console.error('✗ Environment validation failed:', err.message);
  process.exit(1);
}

// Configure logger
const logger = configureLogger();
logger.info('Starting Fishery Monitoring System', {
  nodeVersion: process.version,
  environment: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000
});

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Trust proxy (important for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware with Helmet
// Note: CSP and COEP are disabled because this is an API-only backend.
// These policies are primarily for protecting browsers rendering HTML/JS,
// which is not the case for REST APIs. All other security headers are enabled.
app.use(helmet({
  contentSecurityPolicy: false, // Not applicable for API-only backend
  crossOriginEmbedderPolicy: false // Not applicable for API-only backend
}));

// Compression middleware
app.use(compression());

// CORS middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));

// Body parsing middleware with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID middleware for tracing
app.use(requestId);

// Request timeout middleware (30 seconds)
app.use(requestTimeout(30000));

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      requestId: req.requestId
    });
    res.status(429).json({
      error: 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

// Apply rate limiting to API routes only
app.use('/api', limiter);

// Make io accessible to routes
app.set('io', io);

// Routes
const tankRoutes = require('./routes/tanks');
const sensorRoutes = require('./routes/sensors');
const alertRoutes = require('./routes/alerts');
const inventoryRoutes = require('./routes/inventory');
const reportRoutes = require('./routes/reports');
const authRoutes = require('./routes/auth');

app.use('/api/auth', authRoutes);
app.use('/api/tanks', tankRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', reportRoutes);

// Enhanced health check endpoint
app.get('/health', async (req, res) => {
  const dbHealth = await db.healthCheck();
  
  const health = {
    status: dbHealth.healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: require('../../package.json').version,
    database: dbHealth
  };

  const statusCode = dbHealth.healthy ? 200 : 503;
  res.status(statusCode).json(health);
});

// Metrics endpoint for monitoring
app.get('/metrics', (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    process: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    },
    system: {
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid
    }
  };
  
  res.json(metrics);
});

// Socket.IO connection handling with error handling
io.on('connection', (socket) => {
  logger.info('WebSocket client connected', { socketId: socket.id });
  
  socket.on('disconnect', (reason) => {
    logger.info('WebSocket client disconnected', { socketId: socket.id, reason });
  });
  
  socket.on('error', (error) => {
    logger.error('WebSocket error', { socketId: socket.id, error: error.message });
  });
  
  socket.on('subscribe_tank', (tankId) => {
    socket.join(`tank_${tankId}`);
    logger.debug('Client subscribed to tank', { socketId: socket.id, tankId });
  });
  
  socket.on('unsubscribe_tank', (tankId) => {
    socket.leave(`tank_${tankId}`);
    logger.debug('Client unsubscribed from tank', { socketId: socket.id, tankId });
  });
});

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Error handling middleware - must be last
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// Graceful shutdown handler
let isShuttingDown = false;

const gracefulShutdown = async (signal) => {
  if (isShuttingDown) {
    return;
  }
  
  isShuttingDown = true;
  logger.info(`${signal} signal received: closing HTTP server`);
  
  // Stop accepting new connections
  server.close(async (err) => {
    if (err) {
      logger.error('Error closing server', { error: err.message });
      process.exit(1);
    }
    
    logger.info('HTTP server closed');
    
    // Close database connections
    try {
      await db.gracefulShutdown();
      logger.info('All connections closed successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown', { error: error.message });
      process.exit(1);
    }
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason,
    promise: promise
  });
  gracefulShutdown('unhandledRejection');
});

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, {
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    nodeVersion: process.version
  });
  
  // Test database connection on startup
  db.healthCheck().then(health => {
    if (health.healthy) {
      logger.info('Database connection verified', { database: health.database });
    } else {
      logger.error('Database connection failed', { error: health.error });
    }
  });
});

module.exports = { app, server, io };
