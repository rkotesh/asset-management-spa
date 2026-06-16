import mongoose from 'mongoose';

const querySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [100, 'Subject cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['open', 'resolved'],
    default: 'open',
    index: true // Index for quick querying of active / completed requests
  }
}, {
  timestamps: true
});

const Query = mongoose.model('Query', querySchema);
export default Query;
