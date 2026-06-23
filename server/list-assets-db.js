import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Asset from './src/models/Asset.js';

dotenv.config();

const listAssets = async () => {
  const dbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/asset_management';
  console.log(`Connecting to database at ${dbUri}...`);

  try {
    await mongoose.connect(dbUri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log('Connected to database.');

    const assets = await Asset.find({});
    console.log(`Found ${assets.length} assets:`);
    assets.forEach(a => {
      console.log(`- Title: "${a.title}"`);
      console.log(`  ID: ${a._id}`);
      console.log(`  fileType: "${a.fileType}"`);
      console.log(`  mimeType: "${a.mimeType}"`);
      console.log(`  s3Key: "${a.s3Key}"`);
      console.log(`  contentHash: "${a.contentHash}"`);
    });

    process.exit(0);
  } catch (error) {
    console.warn(`[WARNING] Database connection failed: ${error.message}`);
    process.exit(1);
  }
};

listAssets();
