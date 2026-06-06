// FILE 2: src/config/database.js
// 1. Purpose of the File
// Why This File Exists:
// This is the database connection manager for the entire application. It encapsulates all MongoDB connection logic, error handling, and graceful shutdown procedures.

// What Responsibility It Has:

// Establish and maintain MongoDB connection

// Configure connection pool settings

// Handle connection events (error, disconnect, reconnect)

// Implement graceful shutdown

// Provide connection status monitoring

// Why It Belongs in the config/ Folder:
// Database connection is infrastructure configuration. It must be initialized before any data operations occur. Placing it in config/ ensures it's part of the application bootstrapping phase.

// What Problem It Solves:

// Connection Management: Ensures single connection instance across the app

// Resilience: Handles connection failures gracefully

// Resource Management: Proper connection pooling to avoid exhausting database resources

// Observability: Logs connection events for monitoring

// 2. Key Concepts Used
// MongoDB Concepts:

// Connection Pooling:

// javascript
// maxPoolSize: 10  // Maximum 10 concurrent connections
// minPoolSize: 2   // Keep 2 connections ready
// Each connection in the pool can handle one operation at a time. The pool manager queues requests when all connections are busy.

// Replica Set Awareness:
// The driver automatically discovers and monitors all members of a replica set, handling failover automatically.

// Write Concern:

// javascript
// w: 'majority'  // Wait for majority acknowledgment
// Ensures data is written to a majority of replica set members before acknowledging success.

// Node.js Concepts:

// Process Event Handlers:

// javascript
// process.on('SIGINT', async () => {
//   await mongoose.connection.close();
//   process.exit(0);
// });
// SIGINT (Ctrl+C) triggers graceful shutdown. This is crucial for preventing data corruption.

// Async/Await Error Handling:

// javascript
// try {
//   const connection = await mongoose.connect(uri, options);
// } catch (error) {
//   logger.error('MongoDB connection failed:', error);
//   process.exit(1);
// }
// Fails fast - if database can't connect, the application should not start.

// Mongoose Concepts:

// Connection Object:
// mongoose.connection is an EventEmitter that emits events for connection lifecycle management.

// 3. Detailed Code Walkthrough
// javascript
// const mongoose = require('mongoose');
// const environment = require('./environment');
// const logger = require('./logger');
// Import Analysis:

// mongoose: ODM (Object Document Mapper) for MongoDB

// environment: Our centralized configuration

// logger: Winston logging instance

// javascript
// const connectDatabase = async () => {
//   try {
//     const connection = await mongoose.connect(
//       environment.mongodb.uri,
//       environment.mongodb.options
//     );
//     logger.info(`MongoDB connected: ${connection.connection.host}`);
// Connection Process:

// mongoose.connect() returns a Promise

// The Promise resolves when connection is established

// connection.connection.host shows which server we connected to

// If connection fails, it throws and we catch it below

// javascript
//     mongoose.connection.on('error', (error) => {
//       logger.error('MongoDB connection error:', error);
//     });
// Event: 'error'

// Fires when an error occurs on the connection

// Common causes: network issues, authentication failures

// We log but don't crash - the driver handles reconnection

// javascript
//     mongoose.connection.on('disconnected', () => {
//       logger.warn('MongoDB disconnected. Attempting to reconnect...');
//     });
// Event: 'disconnected'

// Fires when connection to MongoDB is lost

// Driver automatically attempts reconnection

// We log a warning for monitoring systems

// javascript
//     mongoose.connection.on('reconnected', () => {
//       logger.info('MongoDB reconnected');
//     });
// Event: 'reconnected'

// Fires when connection is restored after a disconnect

// Important for monitoring - alerts that system recovered

// javascript
//     process.on('SIGINT', async () => {
//       await mongoose.connection.close();
//       logger.info('MongoDB connection closed due to app termination');
//       process.exit(0);
//     });
// Graceful Shutdown Pattern:

// text
// User presses Ctrl+C
//   ↓
// Node receives SIGINT signal
//   ↓
// Close MongoDB connection
//   ↓
// Log shutdown event
//   ↓
// Exit process (code 0 = success)
// Without this, active database operations could be interrupted, potentially causing data corruption.

// javascript
//   } catch (error) {
//     logger.error('MongoDB connection failed:', error);
//     process.exit(1);
//   }
// };
// Fail Fast Principle:
// If the application can't connect to the database at startup, there's no point in starting the HTTP server. We exit immediately with error code 1, which tells the process manager (Docker, PM2) that the application failed to start.

// javascript
// const disconnectDatabase = async () => {
//   await mongoose.disconnect();
//   logger.info('MongoDB disconnected');
// };
// Disconnect Function:

// Used in tests to clean up after test suites

// Ensures all connections are properly closed

// Prevents connection leaks in test environments

// 4. Connection Lifecycle Diagram
// text
// Application Start
//   ↓
// connectDatabase() called
//   ↓
// mongoose.connect(uri, options)
//   ↓
// ┌─────────────────────┐
// │  CONNECTING STATE    │
// │  Driver attempts to  │
// │  reach MongoDB       │
// └──────┬──────────────┘
//        │
//        ├── Success → CONNECTED
//        │   ├── 'connected' event fires
//        │   ├── Start monitoring
//        │   └── Application ready
//        │
//        ├── Network issue → DISCONNECTED
//        │   ├── 'disconnected' event fires
//        │   ├── Auto-reconnect started
//        │   └── RECONNECTING state
//        │       ├── Success → 'reconnected' event
//        │       └── Failure → 'error' event
//        │
//        └── Auth failure → 'error' event
//            └── process.exit(1)
// 5. Interview Knowledge
// Q: "How does MongoDB handle connection pooling in Node.js?"

// javascript
// "Mongoose manages a connection pool internally. Each 
// mongoose.connect() creates a pool with:

// - minPoolSize (2): Keep this many connections open even when idle
// - maxPoolSize (10): Maximum concurrent connections

// When you execute a query:
// 1. Pool manager checks for available connection
// 2. If available: uses it immediately
// 3. If all busy: queues the request
// 4. If queue full: throws error

// This is more efficient than creating new connections per request."
// Q: "What's the difference between connection pooling and single connection?"

// javascript
// // Single connection (bad for production)
// const connection = await mongoose.connect(uri);
// // Only 1 operation at a time!

// // Connection pool (production)
// const connection = await mongoose.connect(uri, {
//   maxPoolSize: 10  // 10 concurrent operations
// });
// // Multiple operations execute in parallel

// Example:
// - Without pool: 100 requests = 100 sequential operations (slow)
// - With pool of 10: 100 requests = processed in batches of 10 (fast)
// 6. Learning Notes
// What You Should Learn:

// Always use connection pooling in production

// Handle connection events for observability

// Implement graceful shutdown

// Fail fast if database connection fails

// Monitor connection health

// Common Mistakes Beginners Make:

// Creating new connections per request (massive performance hit)

// Not handling disconnection events

// Setting maxPoolSize too high (exhausting database resources)

// Not implementing graceful shutdown

// Hiding connection errors instead of failing fast

// Best Practices Demonstrated:

// Connection pooling configuration

// Event-driven connection monitoring

// Graceful shutdown implementation

// Centralized database connection management

// Proper error handling and logging


const mongoose = require('mongoose');
const environment = require('./environment');
const logger = require('./logger');

const connectDatabase = async () => {
  try {
    const connection = await mongoose.connect(
      environment.mongodb.uri,
      environment.mongodb.options
    );

    logger.info(`MongoDB connected: ${connection.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed due to app termination');
      process.exit(0);
    });

    return connection;
  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

const disconnectDatabase = async () => {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
};

module.exports = { connectDatabase, disconnectDatabase };