import mongoose from 'mongoose';

const workflowSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  trigger: {
    event: { type: String, required: true, index: true },
    description: { type: String },
    payload: { type: mongoose.Schema.Types.Mixed }
  },
  actions: {
    type: [mongoose.Schema.Types.Mixed],
    required: true
  },
  conditions: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Workflow = mongoose.model('Workflow', workflowSchema);
export default Workflow;
