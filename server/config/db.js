import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // MongoDB connection options for production stability
    const options = {
      // Connection pool settings
      maxPoolSize: 10, // Maximum number of connections in the pool
      minPoolSize: 2,  // Minimum number of connections in the pool

      // Timeout settings
      serverSelectionTimeoutMS: 10000, // Timeout for server selection (10s)
      socketTimeoutMS: 45000,          // Socket timeout (45s)
      connectTimeoutMS: 10000,         // Initial connection timeout (10s)

      // Keep connection alive
      heartbeatFrequencyMS: 10000, // Check server health every 10s

      // Buffer commands when disconnected (helps during brief disconnections)
      bufferCommands: true,

      // Auto-retry writes
      retryWrites: true,
      retryReads: true
    };

    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/angel-baby-dresses',
      options
    );

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Connection event handlers for monitoring and auto-reconnection
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connection established');
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected successfully');
    });

    // Handle close event
    mongoose.connection.on('close', () => {
      console.log('MongoDB connection closed');
    });

  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // Don't exit immediately - let PM2 handle restart with backoff
    // This gives time for the database to recover
    setTimeout(() => {
      process.exit(1);
    }, 5000);
  }
};

// Graceful shutdown function - export for use in server.js
export const closeDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error.message);
  }
};

export default connectDB;
