import mongoose from 'mongoose';

const workflowExecutionSchema = new mongoose.Schema({
  workflowName: {
    type: String,
    required: true,
    index: true
  },
  triggerEvent: {
    type: String,
    required: true
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ['completed', 'skipped', 'failed'],
    required: true,
    index: true
  },
  steps: [{
    step: { type: Number, required: true },
    action: { type: String, required: true },
    status: { type: String, enum: ['completed', 'skipped', 'failed'], required: true },
    output: { type: mongoose.Schema.Types.Mixed },
    error: { type: String }
  }],
  error: {
    type: String
  },
  durationMs: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const WorkflowExecution = mongoose.model('WorkflowExecution', workflowExecutionSchema);
export default WorkflowExecution;
