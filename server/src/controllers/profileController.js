import User from '../models/User.js';
import bcrypt from 'bcrypt';

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found',
        code: 404
      });
    }

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get Profile Error:', error.message);
    res.status(500).json({
      error: true,
      message: 'Server error retrieving profile',
      code: 500
    });
  }
};

// @desc    Update user profile details
// @route   PUT /api/profile
// @access  Private
export const updateProfile = async (req, res) => {
  const { name, email } = req.body;

  if (!name && !email) {
    return res.status(400).json({
      error: true,
      message: 'Name or email is required for updating profile',
      code: 400
    });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found',
        code: 404
      });
    }

    if (name) user.name = name;

    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      // Check if email is already taken
      const emailExists = await User.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return res.status(400).json({
          error: true,
          message: 'This email is already in use by another account',
          code: 400
        });
      }
      user.email = email.toLowerCase();
    }

    await user.save();

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Update Profile Error:', error.message);
    res.status(500).json({
      error: true,
      message: 'Server error updating profile',
      code: 500
    });
  }
};

// @desc    Update user password
// @route   PUT /api/profile/password
// @access  Private
export const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      error: true,
      message: 'Current password and new password are required',
      code: 400
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      error: true,
      message: 'New password must be at least 6 characters long',
      code: 400
    });
  }

  try {
    // Select the passwordHash explicitly
    const user = await User.findById(req.user.id).select('+passwordHash');
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found',
        code: 404
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        error: true,
        message: 'Incorrect current password',
        code: 400
      });
    }

    // Hash the new password (10 rounds)
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Update Password Error:', error.message);
    res.status(500).json({
      error: true,
      message: 'Server error updating password',
      code: 500
    });
  }
};
