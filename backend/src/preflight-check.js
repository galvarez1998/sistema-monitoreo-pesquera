#!/usr/bin/env node

/**
 * Pre-flight check script to validate system configuration
 * Run this before starting the server to catch configuration issues early
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`)
};

let hasErrors = false;

console.log('\n🔍 Running pre-flight checks...\n');

// Check 1: Node.js version
log.info('Checking Node.js version...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion >= 18) {
  log.success(`Node.js ${nodeVersion} (>= 18 required)`);
} else {
  log.error(`Node.js ${nodeVersion} (>= 18 required)`);
  hasErrors = true;
}

// Check 2: .env file exists
log.info('Checking .env file...');
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  log.success('.env file exists');
  
  // Load and check required env vars
  require('dotenv').config();
  
  const requiredVars = [
    'DB_HOST',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'JWT_SECRET'
  ];
  
  log.info('Checking required environment variables...');
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      log.success(`${varName} is set`);
    } else {
      log.error(`${varName} is missing`);
      hasErrors = true;
    }
  });
  
  // Check JWT_SECRET length
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    log.error('JWT_SECRET must be at least 32 characters for security');
    hasErrors = true;
  } else if (process.env.JWT_SECRET) {
    log.success('JWT_SECRET length is adequate (>= 32 chars)');
  }
  
  // Warn about default or example values
  if (process.env.JWT_SECRET === 'your_jwt_secret_key_here_must_be_at_least_32_characters_long' || 
      process.env.JWT_SECRET === 'change_this_secret_key_in_production_min_32_chars_required_for_security') {
    log.warn('JWT_SECRET appears to be a default value - change it in production!');
  }
  
  if (process.env.DB_PASSWORD === 'your_password' || 
      process.env.DB_PASSWORD === 'postgres_password') {
    log.warn('DB_PASSWORD appears to be a default value - change it in production!');
  }
  
} else {
  log.error('.env file not found');
  log.info('Copy .env.example to .env and configure it');
  hasErrors = true;
}

// Check 3: Required directories exist
log.info('Checking directory structure...');
const requiredDirs = [
  path.join(__dirname, 'routes'),
  path.join(__dirname, 'database'),
  path.join(__dirname, 'middleware'),
  path.join(__dirname, 'config')
];

requiredDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    log.success(`Directory exists: ${path.basename(dir)}/`);
  } else {
    log.error(`Directory missing: ${path.basename(dir)}/`);
    hasErrors = true;
  }
});

// Check 4: Dependencies installed
log.info('Checking npm dependencies...');
const nodeModules = path.join(__dirname, '..', 'node_modules');
if (fs.existsSync(nodeModules)) {
  log.success('node_modules directory exists');
  
  // Check for critical packages
  const criticalPackages = [
    'express',
    'pg',
    'socket.io',
    'helmet',
    'compression',
    'express-rate-limit',
    'winston'
  ];
  
  criticalPackages.forEach(pkg => {
    const pkgPath = path.join(nodeModules, pkg);
    if (fs.existsSync(pkgPath)) {
      log.success(`Package installed: ${pkg}`);
    } else {
      log.error(`Package missing: ${pkg}`);
      hasErrors = true;
    }
  });
} else {
  log.error('node_modules not found - run npm install');
  hasErrors = true;
}

// Check 5: Syntax check on main files
log.info('Checking syntax of main files...');
const mainFiles = [
  path.join(__dirname, 'server.js'),
  path.join(__dirname, 'database', 'db.js'),
  path.join(__dirname, 'config', 'env.js'),
  path.join(__dirname, 'config', 'logger.js')
];

mainFiles.forEach(file => {
  try {
    require(file);
    log.success(`Syntax OK: ${path.relative(__dirname, file)}`);
  } catch (err) {
    log.error(`Syntax error in ${path.relative(__dirname, file)}: ${err.message}`);
    hasErrors = true;
  }
});

// Final summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log(`${colors.red}❌ Pre-flight checks FAILED${colors.reset}`);
  console.log('Please fix the errors above before starting the server.\n');
  process.exit(1);
} else {
  console.log(`${colors.green}✅ All pre-flight checks PASSED${colors.reset}`);
  console.log('System is ready to start!\n');
  process.exit(0);
}
