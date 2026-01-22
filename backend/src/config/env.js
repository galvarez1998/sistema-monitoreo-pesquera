const Joi = require('joi');

/**
 * Environment variables schema for validation
 */
const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  
  PORT: Joi.number()
    .default(3000),
  
  DB_HOST: Joi.string()
    .required(),
  
  DB_PORT: Joi.number()
    .default(5432),
  
  DB_NAME: Joi.string()
    .required(),
  
  DB_USER: Joi.string()
    .required(),
  
  DB_PASSWORD: Joi.string()
    .required(),
  
  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .messages({
      'string.min': 'JWT_SECRET must be at least 32 characters for security'
    }),
  
  JWT_EXPIRE: Joi.string()
    .default('24h'),
  
  FRONTEND_URL: Joi.string()
    .uri()
    .default('http://localhost:3001'),
  
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info'),
  
  RATE_LIMIT_WINDOW_MS: Joi.number()
    .default(900000), // 15 minutes
  
  RATE_LIMIT_MAX: Joi.number()
    .default(100)
}).unknown(true); // Allow other environment variables

/**
 * Validate environment variables
 * @throws {Error} If validation fails
 */
const validateEnv = () => {
  const { error, value } = envSchema.validate(process.env, {
    abortEarly: false,
    stripUnknown: false
  });

  if (error) {
    const errorMessages = error.details.map(detail => detail.message).join(', ');
    throw new Error(`Environment validation failed: ${errorMessages}`);
  }

  return value;
};

module.exports = { validateEnv };
