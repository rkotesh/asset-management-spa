import Query from '../models/Query.js';
import sendMail from '../utils/mailer.js';

// @desc    Create a new support query
// @route   POST /api/queries
// @access  Private
export const createQuery = async (req, res) => {
  const { subject, message } = req.body;

  if (!subject || !message) {
    return res.status(400).json({
      error: true,
      message: 'Subject and message are required fields',
      code: 400
    });
  }

  if (req.user.role === 'admin') {
    return res.status(403).json({
      error: true,
      message: 'Administrator accounts are not permitted to submit support queries',
      code: 403
    });
  }

  try {
    const query = await Query.create({
      userId: req.user.id,
      subject,
      message
    });

    // Notify Administrator via Nodemailer
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const emailSubject = `New Support Query: ${subject}`;
    const emailText = `A new support query has been submitted.

From: ${req.user.name} (${req.user.email})
Subject: ${subject}
Message:
${message}

Access the admin dashboard to review and resolve this request.`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f46e5; margin-bottom: 15px;">Support Query Submitted</h2>
        <p><strong>From:</strong> ${req.user.name} (&lt;${req.user.email}&gt;)</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 15px; margin: 20px 0; border-radius: 4px; font-style: italic; white-space: pre-wrap;">
          ${message}
        </div>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">Please log into the Admin panel of the Asset Management SPA to mark this query as resolved.</p>
      </div>
    `;

    // Fire-and-forget email notification (won't block HTTP response)
    sendMail({
      to: adminEmail,
      subject: emailSubject,
      text: emailText,
      html: emailHtml
    }).catch(err => console.error('Admin query notification email failed:', err.message));

    res.status(201).json({
      success: true,
      query
    });
  } catch (error) {
    console.error('Create Query Error:', error.message);
    res.status(500).json({
      error: true,
      message: 'Server error submitting query',
      code: 500
    });
  }
};

// @desc    Get all queries (Admin only)
// @route   GET /api/queries
// @access  Private/Admin
export const getQueries = async (req, res) => {
  try {
    const queries = await Query.find({})
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ queries });
  } catch (error) {
    console.error('Get Queries Error:', error.message);
    res.status(500).json({
      error: true,
      message: 'Server error retrieving queries',
      code: 500
    });
  }
};

// @desc    Mark a query as resolved (Admin only)
// @route   PUT /api/queries/:id
// @access  Private/Admin
export const resolveQuery = async (req, res) => {
  const { response } = req.body;

  try {
    const query = await Query.findById(req.params.id).populate('userId', 'name email');
    if (!query) {
      return res.status(404).json({
        error: true,
        message: 'Query not found',
        code: 404
      });
    }

    query.status = 'resolved';
    query.response = response || 'Query marked as resolved by Administrator';
    query.respondedAt = new Date();
    await query.save();

    // Notify User via Nodemailer
    if (query.userId && query.userId.email) {
      const emailSubject = `Support Query Resolved: ${query.subject}`;
      const emailText = `Hello ${query.userId.name},

Your support request regarding "${query.subject}" has been marked as resolved by the Administrator.

Administrator Response:
"${query.response}"

Thank you.`;

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #10b981; margin-bottom: 15px;">Support Query Resolved</h2>
          <p>Hello <strong>${query.userId.name}</strong>,</p>
          <p>Your support request regarding "<strong>${query.subject}</strong>" has been marked as resolved.</p>
          <h3 style="color: #4f46e5; margin-top: 20px; margin-bottom: 10px;">Administrator Response:</h3>
          <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 15px; margin: 15px 0; border-radius: 4px; font-style: italic; white-space: pre-wrap;">
            ${query.response}
          </div>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">This is a system generated notification.</p>
        </div>
      `;

      sendMail({
        to: query.userId.email,
        subject: emailSubject,
        text: emailText,
        html: emailHtml
      }).catch(err => console.error('User query resolution email failed:', err.message));
    }

    res.status(200).json({
      success: true,
      query
    });
  } catch (error) {
    console.error('Resolve Query Error:', error.message);
    res.status(500).json({
      error: true,
      message: 'Server error resolving query',
      code: 500
    });
  }
};

// @desc    Get logged in user's own queries
// @route   GET /api/queries/my-queries
// @access  Private
export const getUserQueries = async (req, res) => {
  try {
    const queries = await Query.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ queries });
  } catch (error) {
    console.error('Get User Queries Error:', error.message);
    res.status(500).json({
      error: true,
      message: 'Server error retrieving your queries',
      code: 500
    });
  }
};
