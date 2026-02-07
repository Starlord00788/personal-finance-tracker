require('dotenv').config();

const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  // Database Configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'finance_tracker',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret_for_dev_only',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },

  // Rate Limiting
  rateLimiting: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // requests per window
  },
};

// Validate required environment variables for Day 1
const requiredEnvVars = ['DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    if (process.env.NODE_ENV !== 'development') {
      process.exit(1);
    }
  }
});

module.exports = config;