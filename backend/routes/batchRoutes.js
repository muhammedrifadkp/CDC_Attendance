const express = require('express');
const router = express.Router();
const {
  createBatch,
  getBatches,
  getBatchById,
  updateBatch,
  deleteBatch,
  getBatchStudents,
  toggleBatchFinished,
  getBatchesByCourse,
  getBatchesByDepartment,
  getBatchStats,
  getBatchesOverview,
} = require('../controllers/batchController');
const { protect, teacher, admin } = require('../middleware/authMiddleware');

// Create middleware that allows both admin and teacher access
const adminOrTeacher = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'teacher')) {
    next();
  } else {
    return res.status(403).json({
      message: 'Not authorized. Admin or Teacher access required.',
      error: 'AdminOrTeacherAccessRequired'
    });
  }
};

router.route('/')
  .post(protect, adminOrTeacher, createBatch)
  .get(protect, adminOrTeacher, getBatches);

router.get('/overview', protect, getBatchesOverview);

router.route('/course/:courseId')
  .get(protect, getBatchesByCourse);

router.route('/department/:departmentId')
  .get(protect, getBatchesByDepartment);

router.route('/:id')
  .get(protect, getBatchById)
  .put(protect, adminOrTeacher, updateBatch)
  .delete(protect, adminOrTeacher, deleteBatch);

router.get('/:id/stats', protect, getBatchStats);

router.get('/:id/students', protect, getBatchStudents);
router.put('/:id/toggle-finished', protect, adminOrTeacher, toggleBatchFinished);

module.exports = router;
