import crypto from 'crypto';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { sendEmail, emailTemplates } from '../services/emailService.js';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        preferredLanguage: user.preferredLanguage,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, preferredLanguage } = req.body;

    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (preferredLanguage) user.preferredLanguage = preferredLanguage;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update password
// @route   PUT /api/auth/password
// @access  Private
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Security: Don't reveal if email exists or not
      return res.json({
        success: true,
        message: 'If an account with this email exists, you will receive a password reset link shortly.'
      });
    }

    // Generate reset token (unhashed version for email)
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Store hashed version in database (more secure)
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes (more user-friendly)

    // Save with validateBeforeSave: false to skip password validation
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    // Send email
    const { subject, html } = emailTemplates.passwordReset(resetUrl, user.preferredLanguage);
    const emailResult = await sendEmail({
      to: user.email,
      subject,
      html,
      text: `Reset your password by visiting: ${resetUrl}\n\nThis link will expire in 30 minutes.`
    });

    if (!emailResult.success) {
      // Reset the token since email failed
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      console.error('Failed to send password reset email:', emailResult.error);
      return res.status(500).json({
        success: false,
        message: 'Unable to send reset email. Please try again later or contact support.'
      });
    }

    console.log(`Password reset email sent to ${user.email}`);

    res.json({
      success: true,
      message: 'If an account with this email exists, you will receive a password reset link shortly.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.'
    });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    // Validate password
    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Hash the token from URL to compare with stored hash
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    // Find user with valid token (not expired)
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    // Check if token exists but is expired
    if (!user) {
      const expiredUser = await User.findOne({ resetPasswordToken });

      if (expiredUser) {
        // Token exists but expired
        expiredUser.resetPasswordToken = undefined;
        expiredUser.resetPasswordExpire = undefined;
        await expiredUser.save({ validateBeforeSave: false });

        return res.status(400).json({
          success: false,
          message: 'Your reset link has expired. Please request a new password reset.',
          code: 'TOKEN_EXPIRED'
        });
      }

      // Token doesn't exist at all
      return res.status(400).json({
        success: false,
        message: 'This reset link is invalid. Please request a new password reset.',
        code: 'TOKEN_INVALID'
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    // Save user (pre-save hook will hash the password)
    await user.save();

    console.log(`Password reset successful for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Your password has been reset successfully! You can now log in with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to reset password. Please try again or contact support.'
    });
  }
};

// @desc    Add address
// @route   POST /api/auth/addresses
// @access  Private
export const addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // If this is the first address or marked as default, set others to non-default
    if (req.body.isDefault || user.addresses.length === 0) {
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
      req.body.isDefault = true;
    }

    user.addresses.push(req.body);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: user.addresses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update address
// @route   PUT /api/auth/addresses/:id
// @access  Private
export const updateAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const address = user.addresses.id(req.params.id);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // If setting as default, unset others
    if (req.body.isDefault) {
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    Object.assign(address, req.body);
    await user.save();

    res.json({
      success: true,
      message: 'Address updated successfully',
      data: user.addresses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete address
// @route   DELETE /api/auth/addresses/:id
// @access  Private
export const deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses.pull(req.params.id);
    await user.save();

    res.json({
      success: true,
      message: 'Address deleted successfully',
      data: user.addresses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Toggle wishlist item
// @route   POST /api/auth/wishlist/:productId
// @access  Private
export const toggleWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const productId = req.params.productId;

    const index = user.wishlist.indexOf(productId);
    if (index > -1) {
      user.wishlist.splice(index, 1);
    } else {
      user.wishlist.push(productId);
    }

    await user.save();
    await user.populate('wishlist');

    res.json({
      success: true,
      message: index > -1 ? 'Removed from wishlist' : 'Added to wishlist',
      data: user.wishlist
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get wishlist
// @route   GET /api/auth/wishlist
// @access  Private
export const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');

    res.json({
      success: true,
      data: user.wishlist
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
