const winston = require('winston');
const path = require('path');

/**
 * Configure Winston logger with multiple transports
 */
const configureLogger = () => {
  const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  );

  const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, ...metadata }) => {
      let msg = `${timestamp} [${level}]: ${message}`;
      
      if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
      }
      
      return msg;
    })
  );

  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { 
      service: 'fishery-monitoring',
      environment: process.env.NODE_ENV || 'development'
    },
    transports: [
      // Console transport for all environments
      new winston.transports.Console({
        format: consoleFormat,
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
      })
    ]
  });

  // Add file transports in production
  if (process.env.NODE_ENV === 'production') {
    const logDir = process.env.LOG_DIR || path.join(__dirname, '../../logs');
    
    logger.add(new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }));

    logger.add(new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }));
  }

  return logger;
};

module.exports = configureLogger;
