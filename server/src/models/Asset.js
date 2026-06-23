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
    enum: ['pdf', 'image', 'text', 'word', 'excel', 'powerpoint', 'video', 'audio', 'archive', 'other'],
    required: [true, 'File type is required'],
    index: true
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required']
  },
  contentHash: {
    type: String,
    index: true
  },
  thumbnailUrl: {
    type: String
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
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  categories: {
    type: [String],
    default: ['General']
  }
}, {
  timestamps: { createdAt: 'uploadedAt', updatedAt: false } // Only track uploadedAt
});

const Asset = mongoose.model('Asset', assetSchema);
export default Asset;
