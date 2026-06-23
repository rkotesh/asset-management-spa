import Workflow from '../models/Workflow.js';
import WorkflowExecution from '../models/WorkflowExecution.js';
import User from '../models/User.js';
import { sendMail } from './mailer.js';

/**
 * Evaluates skip_if conditions based on current context
 */
function evaluateSkipIfCondition(conditionStr, context) {
  if (!conditionStr || typeof conditionStr !== 'string') return false;

  const normalized = conditionStr.trim().toLowerCase();

  // Condition: "asset_url is null"
  if (normalized === 'asset_url is null') {
    const assetUrl = context.payload?.asset_url || context.asset_url;
    return assetUrl === null || assetUrl === undefined || assetUrl === '';
  }

  // Condition: "users list is empty"
  if (normalized === 'users list is empty') {
    const users = context.users;
    return !users || !Array.isArray(users) || users.length === 0;
  }

  return false;
}

/**
 * Interpolates string with context variables (Mustache style: {{key.path}})
 */
function interpolate(str, context) {
  if (typeof str !== 'string') return str;
  return str.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const keys = path.trim().split('.');
    let val = context;
    for (const key of keys) {
      if (val === null || val === undefined) return '';
      val = val[key];
    }
    return val !== undefined && val !== null ? val : '';
  });
}

/**
 * Recursively interpolates object values containing {{...}} placeholders
 */
function interpolateObject(obj, context) {
  if (typeof obj === 'string') {
    return interpolate(obj, context);
  } else if (Array.isArray(obj)) {
    return obj.map(item => interpolateObject(item, context));
  } else if (obj !== null && typeof obj === 'object') {
    const res = {};
    for (const key in obj) {
      res[key] = interpolateObject(obj[key], context);
    }
    return res;
  }
  return obj;
}

/**
 * Renders a premium, modern HTML card for asset upload notifications
 */
function buildHtmlEmail(emailData) {
  const greeting = emailData.body?.greeting || 'Hello,';
  const message = emailData.body?.message || 'A new asset has been uploaded.';
  const asset_info = emailData.body?.asset_info || {};
  const cta_button = emailData.body?.cta_button;
  const footer = emailData.body?.footer || 'Asset Management App';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          background-color: #0b0f19;
          color: #e2e8f0;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background: #0f172a;
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 20px;
          padding: 35px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }
        .header {
          text-align: center;
          border-bottom: 1px solid #1e293b;
          padding-bottom: 25px;
          margin-bottom: 25px;
        }
        .logo {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.025em;
          background: linear-gradient(135deg, #818cf8 0%, #c084fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .greeting {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 12px;
          color: #ffffff;
        }
        .message {
          font-size: 15px;
          line-height: 1.6;
          color: #94a3b8;
          margin-bottom: 25px;
        }
        .info-card {
          background: rgba(30, 41, 59, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 28px;
        }
        .info-title {
          font-size: 15px;
          font-weight: 800;
          color: #ffffff;
          margin-top: 0;
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 10px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 14px;
        }
        .info-row:last-child {
          margin-bottom: 0;
        }
        .info-label {
          color: #64748b;
          font-weight: 500;
        }
        .info-value {
          color: #cbd5e1;
          font-weight: 600;
          text-align: right;
        }
        .btn-container {
          text-align: center;
          margin: 32px 0;
        }
        .btn {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: #ffffff !important;
          text-decoration: none;
          padding: 14px 36px;
          font-weight: 700;
          font-size: 14px;
          border-radius: 12px;
          display: inline-block;
          box-shadow: 0 10px 20px rgba(79, 70, 229, 0.25);
          transition: all 0.2s ease;
        }
        .footer {
          text-align: center;
          font-size: 11px;
          color: #475569;
          line-height: 1.6;
          border-top: 1px solid #1e293b;
          padding-top: 25px;
          margin-top: 25px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🔐 SECURE VAULT</div>
        </div>
        <div class="greeting">${greeting}</div>
        <div class="message">${message}</div>
        
        <div class="info-card">
          <div class="info-title">File Details</div>
          <div class="info-row">
            <span class="info-label">Name</span>
            <span class="info-value">${asset_info.name || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Type</span>
            <span class="info-value" style="text-transform: uppercase;">${asset_info.type || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Size</span>
            <span class="info-value">${asset_info.file_size || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Uploaded By</span>
            <span class="info-value">${asset_info.uploaded_by || 'System'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Uploaded At</span>
            <span class="info-value">${asset_info.uploaded_at ? new Date(asset_info.uploaded_at).toLocaleString() : 'N/A'}</span>
          </div>
          ${asset_info.description ? `
          <div class="info-row" style="flex-direction: column; align-items: flex-start; margin-top: 15px; border-top: 1px dashed rgba(255,255,255,0.05); padding-top: 15px;">
            <span class="info-label" style="margin-bottom: 6px;">Description</span>
            <span class="info-value" style="text-align: left; font-weight: normal; color: #94a3b8; font-style: italic;">${asset_info.description}</span>
          </div>
          ` : ''}
        </div>
        
        ${cta_button && cta_button.url ? `
        <div class="btn-container">
          <a href="${cta_button.url}" class="btn" target="_blank">${cta_button.label || 'View File'}</a>
        </div>
        ` : ''}
        
        <div class="footer">${footer}</div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Runs a single workflow configuration with a given trigger payload
 */
export const executeWorkflow = async (workflow, payload) => {
  const startTime = Date.now();
  console.log(`[Workflow Engine] Initiating execution for workflow: "${workflow.name}"`);

  // Step context holds current execution variables
  const context = {
    payload,
    users: [] // initialized empty
  };

  const executionRecord = {
    workflowName: workflow.name,
    triggerEvent: workflow.trigger.event,
    payload,
    status: 'completed',
    steps: [],
    error: null,
    durationMs: 0
  };

  // Evaluate startup skip_if conditions (that don't rely on step outputs)
  if (workflow.conditions && Array.isArray(workflow.conditions.skip_if)) {
    const startupConditions = workflow.conditions.skip_if.filter(c => !c.toLowerCase().includes('list'));
    for (const condition of startupConditions) {
      if (evaluateSkipIfCondition(condition, context)) {
        console.log(`[Workflow Engine] Workflow execution skipped due to early condition: "${condition}"`);
        executionRecord.status = 'skipped';
        executionRecord.durationMs = Date.now() - startTime;
        return await WorkflowExecution.create(executionRecord);
      }
    }
  }

  // Determine retry configuration from metadata
  const maxRetries = workflow.metadata?.retry_on_failure && workflow.metadata?.max_retries 
    ? parseInt(workflow.metadata.max_retries) 
    : 0;

  try {
    for (const action of workflow.actions) {
      console.log(`[Workflow Engine] Executing Step ${action.step}: ${action.action}`);
      let stepStatus = 'completed';
      let stepOutput = null;
      let stepError = null;

      let attempt = 0;
      let stepSuccess = false;

      while (attempt <= maxRetries && !stepSuccess) {
        try {
          if (action.action === 'fetch_users') {
            // Validate database source
            if (action.source === 'database' && action.query && action.query.table === 'users') {
              const filter = action.query.filter || {};
              const fields = action.query.fields || ['id', 'name', 'email'];
              
              // Run query
              const queryResult = await User.find(filter);
              
              // Map result to requested fields
              stepOutput = queryResult.map(user => {
                const mapped = {};
                if (fields.includes('id')) mapped.id = user._id.toString();
                if (fields.includes('name')) mapped.name = user.name;
                if (fields.includes('email')) mapped.email = user.email;
                return mapped;
              });

              // Save to execution context
              context.users = stepOutput;
            } else {
              throw new Error(`Unsupported fetch_users source or table: source=${action.source}, table=${action.query?.table}`);
            }
          } 
          
          else if (action.action === 'send_email') {
            const forEachStr = action.for_each;
            if (forEachStr && forEachStr.startsWith('user in ')) {
              const listName = forEachStr.replace('user in ', '').trim();
              const list = context[listName];

              if (list && Array.isArray(list)) {
                stepOutput = [];
                
                for (const user of list) {
                  const renderingContext = {
                    user,
                    ...payload
                  };

                  // Interpolate template fields
                  const emailConfig = interpolateObject(action.email, renderingContext);
                  
                  // Construct HTML body
                  const htmlBody = buildHtmlEmail(emailConfig);
                  
                  // Plain text fallback
                  const textBody = `${emailConfig.body?.greeting || 'Hello'}\n\n${emailConfig.body?.message || ''}\n\nLink: ${emailConfig.email?.cta_button?.url || payload.asset_url || ''}`;

                  // Trigger nodemailer
                  console.log(`[Workflow Engine] Sending email to ${emailConfig.to}...`);
                  const mailInfo = await sendMail({
                    to: emailConfig.to,
                    subject: emailConfig.subject,
                    text: textBody,
                    html: htmlBody
                  });

                  stepOutput.push({
                    to: emailConfig.to,
                    messageId: mailInfo.messageId
                  });
                }
              } else {
                throw new Error(`Loop variable list "${listName}" not found in context or is not an array`);
              }
            } else {
              throw new Error(`Unsupported for_each parameter in send_email: "${forEachStr}"`);
            }
          } 
          
          else {
            throw new Error(`Unknown action type: "${action.action}"`);
          }

          stepSuccess = true;
        } catch (err) {
          attempt++;
          stepError = err.message;
          console.error(`[Workflow Engine] Step ${action.step} error (Attempt ${attempt}/${maxRetries + 1}):`, err.message);

          if (attempt <= maxRetries) {
            // Wait 1 second before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            stepStatus = 'failed';
          }
        }
      }

      // Record step completion status
      executionRecord.steps.push({
        step: action.step,
        action: action.action,
        status: stepStatus,
        output: stepOutput,
        error: stepError
      });

      if (stepStatus === 'failed') {
        throw new Error(`Step ${action.step} failed: ${stepError}`);
      }

      // Evaluate condition skip_if checking list state (e.g. "users list is empty")
      if (workflow.conditions && Array.isArray(workflow.conditions.skip_if)) {
        const postStepConditions = workflow.conditions.skip_if.filter(c => c.toLowerCase().includes('list'));
        for (const condition of postStepConditions) {
          if (evaluateSkipIfCondition(condition, context)) {
            console.log(`[Workflow Engine] Workflow execution skipped at Step ${action.step} due to condition: "${condition}"`);
            executionRecord.status = 'skipped';
            executionRecord.durationMs = Date.now() - startTime;
            return await WorkflowExecution.create(executionRecord);
          }
        }
      }
    }
  } catch (globalError) {
    executionRecord.status = 'failed';
    executionRecord.error = globalError.message;
  }

  executionRecord.durationMs = Date.now() - startTime;
  const finalRecord = await WorkflowExecution.create(executionRecord);
  console.log(`[Workflow Engine] Finished execution. Status: ${finalRecord.status}, Duration: ${finalRecord.durationMs}ms`);
  return finalRecord;
};

/**
 * Triggers active workflows configured for a specific event
 */
export const triggerWorkflow = async (eventName, payload) => {
  try {
    const activeWorkflows = await Workflow.find({ 'trigger.event': eventName, isActive: true });
    
    if (activeWorkflows.length === 0) {
      console.log(`[Workflow Engine] No active workflows found for event: "${eventName}"`);
      return [];
    }

    console.log(`[Workflow Engine] Found ${activeWorkflows.length} workflow(s) to execute for event: "${eventName}"`);
    const executionPromises = activeWorkflows.map(wf => executeWorkflow(wf, payload));
    return await Promise.all(executionPromises);
  } catch (err) {
    console.error(`[Workflow Engine] Failed to trigger workflows for event "${eventName}":`, err.message);
    return [];
  }
};
