import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { autoSeed } from './seedHelper.js';

let mongoServer = null;

const connectDB = async () => {
  const dbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/asset_management';
  
  try {
    // Attempt standard connection with 2.5s timeout
    console.log(`Connecting to MongoDB at: ${dbUri}...`);
    await mongoose.connect(dbUri, {
      serverSelectionTimeoutMS: 2500
    });
    console.log(`MongoDB Connected successfully!`);
    
    // Auto-seed database
    await autoSeed();
  } catch (error) {
    console.warn(`Standard MongoDB connection failed: ${error.message}`);
    console.log('Starting dynamic MongoMemoryServer fallback...');
    
    try {
      mongoServer = await MongoMemoryServer.create();
      const inMemoryUri = mongoServer.getUri();
      
      console.log(`In-Memory MongoDB Server running at: ${inMemoryUri}`);
      await mongoose.connect(inMemoryUri);
      console.log('MongoDB Connected to In-Memory instance!');
      
      // Auto-seed database
      await autoSeed();
    } catch (memError) {
      console.error(`Failed to start MongoMemoryServer: ${memError.message}`);
      process.exit(1);
    }
  }
};

export default connectDB;
