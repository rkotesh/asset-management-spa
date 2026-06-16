import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

console.log("Connecting to MongoDB at:", process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/asset_management');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/asset_management', {
  serverSelectionTimeoutMS: 3000
})
.then(() => {
  console.log("SUCCESS: Connected to MongoDB!");
  process.exit(0);
})
.catch((err) => {
  console.error("FAILURE: Could not connect to MongoDB:", err.message);
  process.exit(1);
});
