const express = require('express');
const router = express.Router();
const {
  getProjects,
  getFinishedBatches,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getStudentProjects,
  getMyProjects,
  submitProject,
  gradeSubmission,
  getProjectSubmissions,
  downloadSubmissionFile,
  completeProject,
  getProjectCompletionStatus,
  getAllSubmissions,
  updateSubmissionStatus,
  getSubmissionDetails,
  removeSubmission,
  upload
} = require('../controllers/projectController');

const {
  getProjectAnalytics,
  getBatchProjectComparison,
  getStudentProjectPerformance,
  getProjectDashboard
} = require('../controllers/projectAnalyticsController');

const { protect, admin, teacher } = require('../middleware/authMiddleware');

// Project CRUD routes
router.route('/')
  .get(protect, teacher, getProjects)
  .post(protect, teacher, createProject);

router.route('/finished-batches')
  .get(protect, teacher, getFinishedBatches);

router.route('/dashboard')
  .get(protect, teacher, getProjectDashboard);

router.route('/analytics/batch-comparison')
  .get(protect, teacher, getBatchProjectComparison);

router.route('/:id')
  .get(protect, getProject)
  .put(protect, teacher, updateProject)
  .delete(protect, teacher, deleteProject);

// Project submission routes
router.route('/:id/submit')
  .post(protect, upload.array('files', 10), submitProject);

router.route('/:id/submissions')
  .get(protect, teacher, getProjectSubmissions);

router.route('/:id/complete')
  .put(protect, teacher, completeProject);

router.route('/:id/completion-status')
  .get(protect, teacher, getProjectCompletionStatus);

router.route('/submissions/all')
  .get(protect, teacher, getAllSubmissions);

router.route('/submissions/:id')
  .get(protect, getSubmissionDetails)
  .delete(protect, teacher, removeSubmission);

router.route('/submissions/:id/status')
  .put(protect, teacher, updateSubmissionStatus);

router.route('/submissions/:id/grade')
  .put(protect, teacher, gradeSubmission);

router.route('/submissions/:id/download/:fileName')
  .get(protect, teacher, downloadSubmissionFile);

// Analytics routes
router.route('/:id/analytics')
  .get(protect, teacher, getProjectAnalytics);

router.route('/analytics/student-performance/:studentId')
  .get(protect, getStudentProjectPerformance);

// Student-specific routes
router.route('/student/:studentId')
  .get(protect, getStudentProjects);

router.route('/my-projects')
  .get(protect, getMyProjects);

module.exports = router;
