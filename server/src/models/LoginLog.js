import mongoose from 'mongoose';

const loginLogSchema = new mongoose.Schema({
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

const LoginLog = mongoose.model('LoginLog', loginLogSchema);
export default LoginLog;
