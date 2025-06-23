const express = require('express');
const router = express.Router();
const {
  authRateLimiter,
  passwordResetRateLimiter,
  sensitiveOperationsRateLimiter
} = require('../middleware/rateLimitMiddleware');
const {
  loginUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  createTeacher,
  createAdmin,
  getAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  resetAdminPassword,
  getTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  resetTeacherPassword,
  getTeacherStats,
  getTeachersOverview,
  getTeacherAttendanceExport,
  changePassword,
  requestPasswordChangeOTP,
  verifyPasswordChangeOTP,
  verifyOTPAndChangePassword,
  refreshToken,
  forgotPasswordOTP,
  verifyForgotPasswordOTP,
  resetPasswordWithOTP,
  forgotPassword,
  resetPassword,
  previewEmployeeId,
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');
const { validateUserRegistration, validateTeacherRegistration, validateAdminRegistration } = require('../middleware/validationMiddleware');

// Public routes with enhanced rate limiting
router.post('/login', authRateLimiter, loginUser);
router.post('/logout', logoutUser);
router.post('/refresh-token', authRateLimiter, refreshToken);
router.post('/forgot-password', passwordResetRateLimiter, forgotPassword);
router.post('/reset-password/:token', passwordResetRateLimiter, resetPassword);

// Forgot password with OTP routes (public)
router.post('/forgot-password-otp', passwordResetRateLimiter, forgotPasswordOTP);
router.post('/verify-forgot-password-otp', passwordResetRateLimiter, verifyForgotPasswordOTP);
router.put('/reset-password-with-otp', passwordResetRateLimiter, resetPasswordWithOTP);

// Protected routes
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.put('/change-password', protect, changePassword);

// OTP-based password change routes
router.post('/request-password-change-otp', protect, requestPasswordChangeOTP);
router.post('/verify-password-change-otp', protect, verifyPasswordChangeOTP);
router.put('/verify-otp-change-password', protect, verifyOTPAndChangePassword);

// Admin routes
router.route('/')
  .post(protect, admin, validateTeacherRegistration, createTeacher)
  .get(protect, admin, getTeachers);

// Admin management routes
router.route('/admins')
  .post(protect, admin, validateAdminRegistration, createAdmin)
  .get(protect, admin, getAdmins);

router.route('/admins/:id')
  .get(protect, admin, getAdminById)
  .put(protect, admin, updateAdmin)
  .delete(protect, admin, deleteAdmin);

router.put('/admins/:id/reset-password', protect, admin, resetAdminPassword);

// Teacher management routes
router.route('/teachers')
  .get(protect, admin, getTeachers);

router.get('/teachers/overview', protect, admin, getTeachersOverview);

router.route('/teachers/:id')
  .get(protect, admin, getTeacherById)
  .put(protect, admin, updateTeacher)
  .delete(protect, admin, deleteTeacher);

router.get('/teachers/:id/stats', protect, admin, getTeacherStats);
router.get('/teachers/:id/attendance-export', protect, getTeacherAttendanceExport);
router.put('/teachers/:id/reset-password', protect, admin, resetTeacherPassword);

// Employee ID preview route
router.get('/preview-employee-id/:departmentId', protect, admin, previewEmployeeId);

module.exports = router;

