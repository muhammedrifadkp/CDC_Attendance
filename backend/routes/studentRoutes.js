const express = require('express');
const router = express.Router();
const {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  bulkCreateStudents,
  getStudentsByDepartment,
  getStudentsByBatch,
  getStudentStats,
  getStudentsOverview,
  getNextRollNumber,
} = require('../controllers/studentController');
const { protect, teacher } = require('../middleware/authMiddleware');
const { validateStudentRegistration } = require('../middleware/validationMiddleware');

// Debug middleware for student creation
const debugStudentCreation = (req, res, next) => {
  console.log('🔍 DEBUG: Student creation request received');
  console.log('🔍 DEBUG: Request body:', JSON.stringify(req.body, null, 2));
  console.log('🔍 DEBUG: Request headers:', JSON.stringify(req.headers, null, 2));
  console.log('🔍 DEBUG: User:', req.user ? { id: req.user._id, role: req.user.role } : 'Not authenticated');
  next();
};

router.route('/')
  .post(protect, teacher, debugStudentCreation, validateStudentRegistration, createStudent)
  .get(protect, teacher, getStudents);

router.get('/overview', protect, getStudentsOverview);

router.post('/bulk', protect, teacher, bulkCreateStudents);

router.route('/department/:departmentId')
  .get(protect, getStudentsByDepartment);

router.route('/batch/:batchId')
  .get(protect, getStudentsByBatch);

router.get('/batch/:batchId/next-roll-number', protect, getNextRollNumber);

router.route('/:id')
  .get(protect, getStudentById)
  .put(protect, updateStudent)
  .delete(protect, deleteStudent);

router.get('/:id/stats', protect, getStudentStats);

module.exports = router;
