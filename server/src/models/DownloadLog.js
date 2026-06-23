import mongoose from 'mongoose';

const downloadLogSchema = new mongoose.Schema({
  assetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ip: {
    type: String
  },
  userAgent: {
    type: String
  },
  at: {
    type: Date,
    default: Date.now
  }
});

const DownloadLog = mongoose.model('DownloadLog', downloadLogSchema);
export default DownloadLog;
