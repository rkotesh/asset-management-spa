import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import sendMail from '../utils/mailer.js';
import LoginLog from '../models/LoginLog.js';

// Helper to generate access tokens
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'development_secret_key_12345', {
    expiresIn: '30d'
  });
};

// Helper to generate a short-lived reset token
const generateResetToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'development_secret_key_12345', {
    expiresIn: '15m'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      error: true,
      message: 'Name, email, and password are required',
      code: 400
    });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        error: true,
        message: 'A user with this email already exists',
        code: 400
      });
    }

    // Hash password with bcrypt (10 rounds)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user. By default role is 'user'
    const user = await User.create({
      name,
      email,
      passwordHash
    });

    const token = generateToken(user._id);

    // Return token + user details (excluding passwordHash, which is selected out by default)
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        notifications_enabled: user.notifications_enabled
      }
    });
  } catch (error) {
    console.error('Registration Error:', error.message);
    res.status(500).json({
      error: true,
      message: 'Server error during registration',
      code: 500
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: true,
      message: 'Email and password are required',
      code: 400
    });
  }

  try {
    // We must explicitly select passwordHash since it is configured with select: false in the schema
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({
        error: true,
        message: 'Invalid email or password',
        code: 401
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        error: true,
        message: 'Invalid email or password',
        code: 401
      });
    }

    const token = generateToken(user._id);

    // Update user login tracking fields
    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    // Fire-and-forget login logging
    LoginLog.create({
      userId: user._id,
      ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent']
    }).catch(err => {
      console.error('Failed to create LoginLog:', err.message);
    });

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        notifications_enabled: user.notifications_enabled,
        lastLogin: user.lastLogin,
        loginCount: user.loginCount
      }
    });
  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({
      error: true,
      message: 'Server error during login',
      code: 500
    });
  }
};

// @desc    Initiate forgot password reset link
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      error: true,
      message: 'Email address is required',
      code: 400
    });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'No user registered with this email address',
        code: 404
      });
    }

    // Generate reset token valid for 15 minutes
    const resetToken = generateResetToken(user._id);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const mailText = `You are receiving this email because you (or someone else) requested a password reset. 
Please click on the link below, or paste it into your browser, to complete the process within 15 minutes:

${resetUrl}

If you did not request this, please ignore this email.`;

    const mailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f46e5; margin-bottom: 20px;">Reset Your Password</h2>
        <p>You requested a password reset for your account in the Asset Management system.</p>
        <p>Click the button below to reset your password. This link will expire in 15 minutes.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="font-size: 12px; color: #64748b;">If you are having trouble with the button, copy and paste this link into your browser:</p>
        <p style="font-size: 12px; color: #4f46e5; word-break: break-all;">${resetUrl}</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">If you did not request this password reset, please ignore this email.</p>
      </div>
    `;

    await sendMail({
      to: user.email,
      subject: 'Password Reset Request',
      text: mailText,
      html: mailHtml
    });

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email.'
    });
  } catch (error) {
    console.error('Forgot Password Error:', error.message);
    res.status(500).json({
      error: true,
      message: 'Failed to send password reset email',
      code: 500
    });
  }
};

// @desc    Reset password using token
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({
      error: true,
      message: 'Token and new password are required',
      code: 400
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      error: true,
      message: 'Password must be at least 6 characters long',
      code: 400
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'development_secret_key_12345');
    
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found or no longer exists',
        code: 404
      });
    }

    // Hash the new password (10 rounds)
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully. You can now log in with your new password.'
    });
  } catch (error) {
    console.error('Reset Password Error:', error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({
        error: true,
        message: 'Password reset link has expired. Please request a new one.',
        code: 400
      });
    }
    return res.status(400).json({
      error: true,
      message: 'Invalid or malformed reset token',
      code: 400
    });
  }
};
