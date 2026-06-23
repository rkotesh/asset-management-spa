import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import Workflow from '../models/Workflow.js';
import WorkflowExecution from '../models/WorkflowExecution.js';
import { executeWorkflow } from '../utils/workflowEngine.js';

const router = express.Router();

// Apply admin protection to all routes
router.use(protect);
router.use(adminOnly);

// @desc    Get all workflows
// @route   GET /api/workflows
router.get('/', async (req, res) => {
  try {
    const workflows = await Workflow.find().sort({ createdAt: -1 });
    res.status(200).json({ workflows });
  } catch (error) {
    console.error('Get Workflows Error:', error.message);
    res.status(500).json({ error: true, message: 'Server error retrieving workflows' });
  }
});

// @desc    Create/Update a workflow configuration
// @route   POST /api/workflows
router.post('/', async (req, res) => {
  const { name, trigger, actions, conditions, metadata, isActive } = req.body;

  if (!name || !trigger || !actions) {
    return res.status(400).json({
      error: true,
      message: 'Name, trigger and actions are required fields'
    });
  }

  try {
    // Try to update existing or create new workflow by name
    const workflow = await Workflow.findOneAndUpdate(
      { name },
      { name, trigger, actions, conditions: conditions || {}, metadata: metadata || {}, isActive: isActive !== false },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Workflow configuration saved successfully',
      workflow
    });
  } catch (error) {
    console.error('Save Workflow Error:', error.message);
    res.status(500).json({ error: true, message: 'Server error saving workflow configuration' });
  }
});

// @desc    Get all workflow execution logs
// @route   GET /api/workflows/executions
router.get('/executions', async (req, res) => {
  try {
    const executions = await WorkflowExecution.find().sort({ createdAt: -1 });
    res.status(200).json({ executions });
  } catch (error) {
    console.error('Get Executions Error:', error.message);
    res.status(500).json({ error: true, message: 'Server error retrieving execution logs' });
  }
});

// @desc    Retry a workflow execution manually
// @route   POST /api/workflows/executions/:id/retry
router.post('/executions/:id/retry', async (req, res) => {
  try {
    const execution = await WorkflowExecution.findById(req.params.id);
    
    if (!execution) {
      return res.status(404).json({
        error: true,
        message: 'Execution log not found'
      });
    }

    const workflow = await Workflow.findOne({ name: execution.workflowName });
    if (!workflow) {
      return res.status(404).json({
        error: true,
        message: `Workflow "${execution.workflowName}" no longer exists to perform a retry`
      });
    }

    console.log(`[Workflow Engine] Retrying execution ID: ${execution._id}`);
    
    // Rerun workflow with the original payload
    const newExecution = await executeWorkflow(workflow, execution.payload);

    res.status(200).json({
      success: true,
      message: 'Workflow retry completed',
      execution: newExecution
    });
  } catch (error) {
    console.error('Retry Execution Error:', error.message);
    res.status(500).json({ error: true, message: 'Server error retrying workflow execution' });
  }
});

export default router;
