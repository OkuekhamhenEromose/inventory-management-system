// FILE 1: src/config/environment.js
// 1. Purpose of the File
// Why This File Exists:
// This is the centralized configuration management system for the entire application. In production systems, configuration scattered across files is a disaster waiting to happen. This file serves as the Single Source of Truth (SSOT) for all environment-specific settings.

// What Responsibility It Has:

// Centralizes all configuration variables

// Validates and transforms configuration values

// Provides environment-specific settings (development, test, production)

// Handles type conversion (strings from .env to proper types)

// Sets default values for optional configuration

// Prevents hardcoded values throughout the codebase

// Why It Belongs in the config/ Folder:
// The config/ folder is the bootstrapping layer of the application. It contains all initialization and configuration logic that must execute before the application starts. This follows the principle of Separation of Configuration from Implementation.

// What Problem It Solves:

// Configuration Drift: Without this, different parts of the app might reference different environment variables

// Security: Prevents accidental exposure of sensitive defaults

// Maintainability: One place to change configuration instead of hunting through files

// 12-Factor App Compliance: Follows the 12-Factor App methodology for configuration management

// 2. Key Concepts Used
// Node.js Concepts:

// Modules & Exports

// javascript
// module.exports = environment;
// This exports a frozen configuration object that can be imported anywhere. Node.js caches this module after first require(), ensuring the same config object is shared everywhere (Singleton Pattern).

// Process Management

// javascript
// process.env.NODE_ENV
// Node.js provides process.env to access operating system environment variables. This is how we inject configuration without hardcoding.

// Environment Variables

// javascript
// dotenv.config({ path: path.resolve(process.cwd(), envFile) });
// The dotenv library reads .env files and populates process.env. This allows developers to have local configuration without committing secrets to version control.

// Architecture Concepts:

// Configuration as Code: All settings are explicitly defined with types and defaults

// Fail Fast Principle: If required configuration is missing, the app should fail immediately at startup

// Environment Parity: Development, staging, and production differ only in configuration, not code

// 3. Detailed Code Walkthrough
// javascript
// const dotenv = require('dotenv');
// const path = require('path');
// Import Analysis:

// dotenv: Loads environment variables from .env files into process.env

// path: Node.js built-in module for handling file paths across operating systems

// javascript
// const envFile = process.env.NODE_ENV === 'test' 
//   ? '.env.test' 
//   : '.env.development';
// Ternary Operator Logic:

// Checks if we're in test mode

// If test: loads .env.test (test-specific configuration)

// If development: loads .env.development (local development settings)

// This enables environment-specific configuration without changing code

// javascript
// dotenv.config({ path: path.resolve(process.cwd(), envFile) });
// dotenv.config({ path: path.resolve(process.cwd(), '.env') });
// Why Two dotenv.config() Calls?

// First call loads environment-specific file (.env.test or .env.development)

// Second call loads .env (which overrides previous values)

// This creates an override hierarchy:

// text
// .env (highest priority)
//   ↓ overrides
// .env.development
//   ↓ overrides
// .env.example (defaults)
// The path.resolve(process.cwd(), envFile) ensures the path works regardless of where the script is executed from.

// javascript
// const environment = {
//   nodeEnv: process.env.NODE_ENV || 'development',
//   port: parseInt(process.env.PORT, 10) || 3000,
// Type Coercion:

// parseInt(process.env.PORT, 10): Environment variables are always strings. This converts to integer with radix 10 (decimal)

// || 3000: Fallback to default port 3000 if PORT is not set or is empty string

// javascript
//   mongodb: {
//     uri: process.env.NODE_ENV === 'test' 
//       ? process.env.MONGODB_TEST_URI 
//       : process.env.MONGODB_URI,
//     options: {
//       maxPoolSize: 10,
//       minPoolSize: 2,
//       socketTimeoutMS: 45000,
//       serverSelectionTimeoutMS: 5000,
//       heartbeatFrequencyMS: 10000,
//       retryWrites: true,
//       w: 'majority',
//     }
//   },
// MongoDB Connection Pool Configuration:

// maxPoolSize: 10: Maximum 10 concurrent connections to MongoDB

// minPoolSize: 2: Maintain minimum 2 connections for fast response

// socketTimeoutMS: 45000: Close idle sockets after 45 seconds

// serverSelectionTimeoutMS: 5000: Fail if can't connect to server in 5 seconds

// heartbeatFrequencyMS: 10000: Check server health every 10 seconds

// retryWrites: true: Automatically retry failed writes once

// w: 'majority': Wait for acknowledgment from majority of replica set members

// Why These Settings?

// Connection pooling prevents creating new connections for each request (expensive)

// Heartbeat monitoring enables fast detection of failed servers

// Write concern 'majority' ensures data durability in replica sets

// Server selection timeout prevents hanging indefinitely

// javascript
//   jwt: {
//     secret: process.env.JWT_SECRET,
//     expiry: process.env.JWT_EXPIRY || '7d',
//     refreshSecret: process.env.JWT_REFRESH_SECRET,
//     refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '30d',
//   },
// JWT Configuration:

// Two-secret system: access token + refresh token

// Access token (7 days): Short-lived, used for API authentication

// Refresh token (30 days): Long-lived, used to get new access tokens

// This pattern enables token rotation for better security

// javascript
//   rateLimit: {
//     windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
//     max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
//   },
// Rate Limiting Configuration:

// 900,000ms = 15 minutes window

// 100 requests maximum per window

// Prevents brute force attacks and API abuse

// javascript
//   isProduction: process.env.NODE_ENV === 'production',
//   isDevelopment: process.env.NODE_ENV === 'development',
//   isTest: process.env.NODE_ENV === 'test',
// Boolean Flags:
// These computed properties provide clean conditional checks throughout the app:

// javascript
// if (environment.isProduction) {
//   // Production-specific logic
// }
// 4. Relationships
// Which Files Import It:

// src/config/database.js - Gets MongoDB connection string

// src/config/logger.js - Gets logging level and paths

// src/config/redis.js - Gets Redis connection URL

// src/app.js - Gets port and environment info

// src/middleware/auth.middleware.js - Gets JWT secrets

// src/middleware/rateLimiter.middleware.js - Gets rate limit settings

// src/middleware/errorHandler.middleware.js - Checks if development mode

// scripts/seed.js - Gets database URI for seeding

// Where It Sits in Execution Flow:

// text
// Application Start
//   ↓
// 1. app.js requires database.js
//   ↓
// 2. database.js requires environment.js
//   ↓
// 3. environment.js loads .env files
//   ↓
// 4. Configuration object is created
//   ↓
// 5. Database connects using config
//   ↓
// 6. Server starts on configured port
// 5. Architectural Role
// Layer Position:

// text
// Bootstrapping Layer
//   ↓
// Configuration Layer ← THIS FILE
//   ↓
// Infrastructure Layer
//   ↓
// Application Layer
// This file is in the Configuration Layer, which is the foundation of the application. Without it, no other layer knows how to operate.

// 6. Interview Knowledge
// Why This Implementation Was Chosen:

// Approach	Pros	Cons	Our Choice
// Hardcoded values	Simple	Impossible to change per environment	❌
// Multiple .env files scattered	Flexible	Hard to maintain, easy to miss	❌
// Centralized config module	Single source of truth, type-safe	Requires discipline to maintain	✅
// Alternative Implementations:

// convict: Schema-based configuration with validation

// nconf: Hierarchical configuration from multiple sources

// AWS Parameter Store/Azure Key Vault: External configuration for cloud deployments

// config npm package: Another popular configuration library

// Common Interview Questions:

// Q: "How do you manage configuration in Node.js applications?"

// javascript
// // Good answer referencing this file:
// "We use a centralized configuration module that:
// 1. Loads environment-specific .env files
// 2. Validates and transforms configuration
// 3. Provides typed configuration (not raw strings)
// 4. Fails fast if required config is missing
// 5. Never hardcodes values in application code

// This follows the 12-Factor App principle of storing 
// configuration in the environment."
// Q: "How do you handle secrets in production?"

// javascript
// "In production, we never commit secrets to .env files.
// Instead:
// 1. Development: .env.development (gitignored)
// 2. CI/CD: Environment variables in pipeline
// 3. Production: Secrets manager (AWS Secrets Manager/Hashicorp Vault)
// 4. Kubernetes: Secrets mounted as environment variables

// Our config module can load from any source because it 
// abstracts the source behind a simple interface."
// 7. Learning Notes
// What You Should Learn:

// Configuration management is critical in production systems

// Always validate and type-cast configuration values

// Use different strategies for different environments

// Never commit secrets to version control

// Configuration should be loaded once at startup

// Common Mistakes Beginners Make:

// Hardcoding values like database URLs in code

// Not providing defaults for optional configuration

// Committing .env files to git

// Not validating configuration values

// Loading configuration repeatedly instead of caching

// Best Practices Demonstrated:

// Centralized configuration module

// Type coercion for environment variables

// Environment-specific overrides

// Sensible defaults for optional settings

// Single source of truth

// Potential Improvements:

// javascript
// // Add validation to ensure required config exists
// const validateConfig = (config) => {
//   const required = ['mongodb.uri', 'jwt.secret'];
//   for (const key of required) {
//     if (!_.get(config, key)) {
//       throw new Error(`Missing required configuration: ${key}`);
//     }
//   }
// };


const dotenv = require("dotenv");
const path = require("path");

// Load environment-specific .env file
const envFile =
  process.env.NODE_ENV === "test" ? ".env.test" : ".env.development";

dotenv.config({ path: path.resolve(process.cwd(), envFile) });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const environment = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT, 10) || 3000,
  apiVersion: process.env.API_VERSION || "v1",
  appName: process.env.APP_NAME || "Inventory Management System",

  mongodb: {
    uri:
      process.env.NODE_ENV === "test"
        ? process.env.MONGODB_TEST_URI
        : process.env.MONGODB_URI,
    options: {
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      w: "majority",
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiry: process.env.JWT_EXPIRY || "7d",
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || "30d",
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },

  logging: {
    level: process.env.LOG_LEVEL || "info",
    filePath: process.env.LOG_FILE_PATH || "logs/app.log",
  },

  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5242880,
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || "csv,xlsx").split(","),
  },
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
  isTest: process.env.NODE_ENV === "test",
};

module.exports = environment;
