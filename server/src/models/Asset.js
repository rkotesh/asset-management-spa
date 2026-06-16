import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  fileType: {
    type: String,
    enum: ['pdf', 'image', 'text'],
    required: [true, 'File type is required'],
    index: true // Index for fast filtering by file type
  },
  s3Key: {
    type: String,
    required: [true, 'S3 key is required']
  },
  s3Url: {
    type: String
  },
  size: {
    type: Number, // File size in bytes
    required: [true, 'Size in bytes is required']
  }
}, {
  timestamps: { createdAt: 'uploadedAt', updatedAt: false } // Only track uploadedAt
});

const Asset = mongoose.model('Asset', assetSchema);
export default Asset;
