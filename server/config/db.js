import mongoose from 'mongoose';

// Cache the connection across serverless invocations
let cached = global._mongooseConnection;
if (!cached) {
  cached = global._mongooseConnection = { conn: null, promise: null };
}

const connectDB = async () => {
  // If already connected, return the existing connection
  if (cached.conn) {
    return cached.conn;
  }

  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI environment variable is not defined');
  }

  try {
    // MongoDB connection options optimized for serverless
    const options = {
      maxPoolSize: 10,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      heartbeatFrequencyMS: 10000,
      bufferCommands: true,
      retryWrites: true,
      retryReads: true
    };

    if (!cached.promise) {
      cached.promise = mongoose.connect(uri, options).then((m) => m);
    }

    cached.conn = await cached.promise;
    console.log(`MongoDB Connected: ${cached.conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err.message);
      cached.conn = null;
      cached.promise = null;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
      cached.conn = null;
      cached.promise = null;
    });

    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error(`MongoDB Connection Error: ${error.message}`);
    throw error;
  }
};

// Graceful shutdown function - export for use in server.js
export const closeDB = async () => {
  try {
    await mongoose.connection.close();
    cached.conn = null;
    cached.promise = null;
    console.log('MongoDB connection closed through app termination');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error.message);
  }
};

export default connectDB;
