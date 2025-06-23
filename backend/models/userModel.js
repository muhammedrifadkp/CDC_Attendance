const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'teacher'],
      default: 'teacher',
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: function() {
        return this.role === 'teacher';
      },
    },
    employeeId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // Allow null values but ensure uniqueness when present
      required: function() {
        return this.role === 'teacher';
      },
      // Employee identification in format: DEPT-001, LW-001, etc.
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    dateOfJoining: {
      type: Date,
    },
    qualification: {
      type: String,
      trim: true,
    },
    experience: {
      type: Number,
      min: 0,
    },
    specialization: {
      type: String,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    // OTP for password change verification
    passwordChangeOTP: {
      type: String,
      select: false,
    },
    passwordChangeOTPExpires: {
      type: Date,
      select: false,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  // Check if account is locked
  if (this.lockUntil && this.lockUntil > Date.now()) {
    throw new Error('Account is locked. Please try again later.');
  }

  // Validate inputs
  if (!enteredPassword) {
    throw new Error('Password is required');
  }

  if (!this.password) {
    throw new Error('User password not found in database');
  }

  const isMatch = await bcrypt.compare(enteredPassword, this.password);

  // Update failed login attempts
  if (!isMatch) {
    this.failedLoginAttempts += 1;

    // Lock account after 5 failed attempts
    if (this.failedLoginAttempts >= 5) {
      this.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
    }

    await this.save();
    return false;
  }

  // Reset failed attempts on successful login
  if (this.failedLoginAttempts > 0) {
    this.failedLoginAttempts = 0;
    this.lockUntil = null;
    await this.save();
  }

  return true;
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function () {
  // Generate token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Check if password reset token is valid
userSchema.methods.isPasswordResetTokenValid = function (token) {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  return (
    this.passwordResetToken === hashedToken &&
    this.passwordResetExpires > Date.now()
  );
};

// Generate OTP for password change
userSchema.methods.generatePasswordChangeOTP = function () {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  console.log('🔍 OTP Generation Debug:');
  console.log('Generated OTP:', otp);

  // Hash OTP and store
  this.passwordChangeOTP = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');

  // Set expiry (10 minutes)
  this.passwordChangeOTPExpires = Date.now() + 10 * 60 * 1000;

  console.log('Hashed OTP:', this.passwordChangeOTP);
  console.log('OTP expires at:', new Date(this.passwordChangeOTPExpires));

  return otp;
};

// Verify OTP for password change
userSchema.methods.verifyPasswordChangeOTP = function (otp) {
  console.log('🔍 OTP Verification Debug:');
  console.log('Provided OTP:', otp);
  console.log('Stored OTP hash:', this.passwordChangeOTP);
  console.log('OTP expires:', this.passwordChangeOTPExpires);
  console.log('Current time:', Date.now());

  if (!otp || !this.passwordChangeOTP || !this.passwordChangeOTPExpires) {
    console.log('❌ Missing OTP data');
    return false;
  }

  // Check if OTP is expired
  if (this.passwordChangeOTPExpires < Date.now()) {
    console.log('❌ OTP expired');
    return false;
  }

  // Hash provided OTP and compare
  const hashedOTP = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');

  console.log('Provided OTP hash:', hashedOTP);
  console.log('Stored OTP hash:', this.passwordChangeOTP);
  console.log('Hashes match:', this.passwordChangeOTP === hashedOTP);

  return this.passwordChangeOTP === hashedOTP;
};

// Clear password change OTP
userSchema.methods.clearPasswordChangeOTP = function () {
  this.passwordChangeOTP = undefined;
  this.passwordChangeOTPExpires = undefined;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
