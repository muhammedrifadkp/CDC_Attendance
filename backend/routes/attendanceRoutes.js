const express = require('express');
const router = express.Router();
const {
  markAttendance,
  markBulkAttendance,
  getBatchAttendance,
  getStudentAttendance,
  getBatchAttendanceStats,
  getOverallAttendanceAnalytics,
  getAttendanceTrends,
  getTodayAttendanceSummary,
} = require('../controllers/attendanceController');
const { protect, teacher, admin } = require('../middleware/authMiddleware');
const { validateAttendance } = require('../middleware/validationMiddleware');

router.route('/')
  .post(protect, teacher, validateAttendance, markAttendance);

router.post('/bulk', protect, teacher, markBulkAttendance);

router.get('/batch/:batchId', protect, getBatchAttendance);
router.get('/student/:studentId', protect, getStudentAttendance);
router.get('/stats/batch/:batchId', protect, getBatchAttendanceStats);

// Teacher dashboard routes
router.get('/today/summary', protect, teacher, getTodayAttendanceSummary);

// Admin dashboard routes
router.get('/admin/today/summary', protect, admin, getTodayAttendanceSummary);

// Admin analytics routes
router.get('/analytics/overall', protect, admin, getOverallAttendanceAnalytics);
router.get('/analytics/trends', protect, admin, getAttendanceTrends);

module.exports = router;
