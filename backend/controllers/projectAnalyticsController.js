const asyncHandler = require('express-async-handler');
const ProjectAnalytics = require('../models/projectAnalyticsModel');
const ProjectSubmission = require('../models/projectSubmissionModel');
const Project = require('../models/projectModel');
const Student = require('../models/studentModel');
const Batch = require('../models/batchModel');

// @desc    Get project analytics
// @route   GET /api/projects/:id/analytics
// @access  Private (Admin/Teacher)
const getProjectAnalytics = asyncHandler(async (req, res) => {
  const projectId = req.params.id;
  
  const project = await Project.findById(projectId).populate('batch', 'createdBy');
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  // Check permissions
  if (req.user.role === 'teacher') {
    const isAssignedByTeacher = project.assignedBy.toString() === req.user._id.toString();
    const isBatchOwner = project.batch.createdBy && project.batch.createdBy.toString() === req.user._id.toString();

    if (!isAssignedByTeacher && !isBatchOwner) {
      res.status(403);
      throw new Error('Not authorized to view analytics for this project');
    }
  }
  
  // Calculate and get analytics
  const analytics = await ProjectAnalytics.calculateAnalytics(projectId);
  
  const populatedAnalytics = await ProjectAnalytics.findById(analytics._id)
    .populate('project', 'title deadlineDate maxScore')
    .populate('batch', 'name timing section academicYear')
    .populate({
      path: 'topPerformers.student',
      select: 'name rollNo email studentId'
    })
    .populate({
      path: 'topPerformers.submission',
      select: 'finalScore submittedDate submissionTiming'
    });
  
  res.json(populatedAnalytics);
});

// @desc    Get batch project performance comparison
// @route   GET /api/projects/analytics/batch-comparison
// @access  Private (Admin/Teacher)
const getBatchProjectComparison = asyncHandler(async (req, res) => {
  const { batchIds } = req.query;
  
  if (!batchIds) {
    res.status(400);
    throw new Error('Please provide batch IDs for comparison');
  }
  
  const batchIdArray = Array.isArray(batchIds) ? batchIds : batchIds.split(',');
  
  const analytics = await ProjectAnalytics.find({
    batch: { $in: batchIdArray },
    isActive: true
  })
    .populate('project', 'title deadlineDate')
    .populate('batch', 'name timing section academicYear')
    .sort({ 'batch.name': 1 });
  
  // Group by batch for comparison
  const comparisonData = {};
  
  analytics.forEach(analytic => {
    const batchId = analytic.batch._id.toString();
    if (!comparisonData[batchId]) {
      comparisonData[batchId] = {
        batch: analytic.batch,
        projects: [],
        overallStats: {
          totalProjects: 0,
          averageCompletionRate: 0,
          averageFinalScore: 0,
          averageOnTimeRate: 0
        }
      };
    }
    
    comparisonData[batchId].projects.push({
      project: analytic.project,
      completionRate: analytic.completionRate,
      averageFinalScore: analytic.finalScoreStats.average,
      onTimeSubmissionRate: analytic.onTimeSubmissionRate,
      topPerformer: analytic.topPerformers[0] || null
    });
  });
  
  // Calculate overall stats for each batch
  Object.keys(comparisonData).forEach(batchId => {
    const batchData = comparisonData[batchId];
    const projects = batchData.projects;
    
    if (projects.length > 0) {
      batchData.overallStats = {
        totalProjects: projects.length,
        averageCompletionRate: Math.round(
          projects.reduce((sum, p) => sum + p.completionRate, 0) / projects.length
        ),
        averageFinalScore: Math.round(
          projects.reduce((sum, p) => sum + p.averageFinalScore, 0) / projects.length * 10
        ) / 10,
        averageOnTimeRate: Math.round(
          projects.reduce((sum, p) => sum + p.onTimeSubmissionRate, 0) / projects.length
        )
      };
    }
  });
  
  res.json(Object.values(comparisonData));
});

// @desc    Get student performance across projects
// @route   GET /api/projects/analytics/student-performance/:studentId
// @access  Private
const getStudentProjectPerformance = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  
  const student = await Student.findById(studentId).populate('batch');
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }
  
  // Get all submissions by this student
  const submissions = await ProjectSubmission.find({
    student: studentId,
    isActive: true
  })
    .populate('project', 'title deadlineDate maxScore assignedDate')
    .populate('gradedBy', 'name email')
    .sort({ submittedDate: -1 });
  
  // Calculate performance metrics
  const totalSubmissions = submissions.length;
  const gradedSubmissions = submissions.filter(sub => sub.finalScore !== null);
  const averageFinalScore = gradedSubmissions.length > 0 
    ? Math.round(gradedSubmissions.reduce((sum, sub) => sum + sub.finalScore, 0) / gradedSubmissions.length * 10) / 10
    : 0;
  
  const submissionTimingStats = {
    early: submissions.filter(sub => sub.submissionTiming === 'early').length,
    onTime: submissions.filter(sub => sub.submissionTiming === 'on_time').length,
    late: submissions.filter(sub => sub.submissionTiming === 'late').length
  };
  
  const gradeDistribution = {
    aPlus: 0, a: 0, bPlus: 0, b: 0, cPlus: 0, c: 0, f: 0
  };
  
  gradedSubmissions.forEach(sub => {
    const score = sub.finalScore;
    if (score >= 90) gradeDistribution.aPlus++;
    else if (score >= 80) gradeDistribution.a++;
    else if (score >= 70) gradeDistribution.bPlus++;
    else if (score >= 60) gradeDistribution.b++;
    else if (score >= 50) gradeDistribution.cPlus++;
    else if (score >= 40) gradeDistribution.c++;
    else gradeDistribution.f++;
  });
  
  // Get student's rank in each project
  const projectRanks = [];
  for (const submission of gradedSubmissions) {
    const projectSubmissions = await ProjectSubmission.find({
      project: submission.project._id,
      finalScore: { $ne: null },
      isActive: true
    }).countDocuments();
    
    projectRanks.push({
      project: submission.project,
      rank: submission.rank,
      totalStudents: projectSubmissions,
      percentile: projectSubmissions > 0 
        ? Math.round(((projectSubmissions - submission.rank + 1) / projectSubmissions) * 100)
        : 0
    });
  }
  
  const performanceData = {
    student: {
      _id: student._id,
      name: student.name,
      rollNo: student.rollNo,
      studentId: student.studentId,
      batch: student.batch
    },
    summary: {
      totalSubmissions,
      gradedSubmissions: gradedSubmissions.length,
      averageFinalScore,
      averageAttendanceScore: submissions.length > 0 
        ? Math.round(submissions.reduce((sum, sub) => sum + (sub.attendanceScore || 0), 0) / submissions.length)
        : 0,
      submissionTimingStats,
      gradeDistribution
    },
    submissions: submissions.map(sub => ({
      ...sub.toObject(),
      percentile: projectRanks.find(pr => pr.project._id.toString() === sub.project._id.toString())?.percentile || 0
    })),
    projectRanks,
    trends: {
      scoreImprovement: calculateScoreImprovement(gradedSubmissions),
      consistencyRating: calculateConsistencyRating(gradedSubmissions)
    }
  };
  
  res.json(performanceData);
});

// @desc    Get overall project analytics dashboard
// @route   GET /api/projects/analytics/dashboard
// @access  Private (Admin/Teacher)
const getProjectDashboard = asyncHandler(async (req, res) => {
  let filter = { isActive: true };
  
  // If user is teacher, only show their projects
  if (req.user.role === 'teacher') {
    const teacherProjects = await Project.find({ assignedBy: req.user._id }).select('_id');
    const projectIds = teacherProjects.map(p => p._id);
    filter.project = { $in: projectIds };
  }
  
  const analytics = await ProjectAnalytics.find(filter)
    .populate('project', 'title status deadlineDate')
    .populate('batch', 'name timing section');
  
  // Calculate overall statistics
  const totalProjects = analytics.length;
  const totalStudents = analytics.reduce((sum, a) => sum + a.totalStudents, 0);
  const totalSubmissions = analytics.reduce((sum, a) => sum + a.submittedCount, 0);
  const totalGraded = analytics.reduce((sum, a) => sum + a.gradedCount, 0);
  
  const averageCompletionRate = totalProjects > 0 
    ? Math.round(analytics.reduce((sum, a) => sum + a.completionRate, 0) / totalProjects)
    : 0;
  
  const averageFinalScore = analytics.length > 0 
    ? Math.round(analytics.reduce((sum, a) => sum + a.finalScoreStats.average, 0) / analytics.length * 10) / 10
    : 0;
  
  // Recent activity
  const recentSubmissions = await ProjectSubmission.find({
    isActive: true,
    submittedDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
  })
    .populate('student', 'name rollNo')
    .populate('project', 'title')
    .sort({ submittedDate: -1 })
    .limit(10);
  
  // Projects needing attention (low completion rates or approaching deadlines)
  const projectsNeedingAttention = await Project.find({
    status: { $in: ['assigned', 'in_progress'] },
    deadlineDate: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }, // Next 7 days
    isActive: true
  })
    .populate('batch', 'name')
    .sort({ deadlineDate: 1 })
    .limit(5);
  
  const dashboardData = {
    overview: {
      totalProjects,
      totalStudents,
      totalSubmissions,
      totalGraded,
      averageCompletionRate,
      averageFinalScore,
      pendingGrading: totalSubmissions - totalGraded
    },
    recentActivity: recentSubmissions,
    projectsNeedingAttention,
    analytics: analytics.slice(0, 10) // Latest 10 project analytics
  };
  
  res.json(dashboardData);
});

// Helper functions
const calculateScoreImprovement = (submissions) => {
  if (submissions.length < 2) return 0;
  
  const sortedSubmissions = submissions.sort((a, b) => new Date(a.submittedDate) - new Date(b.submittedDate));
  const firstScore = sortedSubmissions[0].finalScore;
  const lastScore = sortedSubmissions[sortedSubmissions.length - 1].finalScore;
  
  return Math.round((lastScore - firstScore) * 10) / 10;
};

const calculateConsistencyRating = (submissions) => {
  if (submissions.length < 2) return 100;
  
  const scores = submissions.map(sub => sub.finalScore);
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) / scores.length;
  const standardDeviation = Math.sqrt(variance);
  
  // Convert to consistency rating (lower deviation = higher consistency)
  const consistencyRating = Math.max(0, 100 - (standardDeviation * 2));
  return Math.round(consistencyRating);
};

module.exports = {
  getProjectAnalytics,
  getBatchProjectComparison,
  getStudentProjectPerformance,
  getProjectDashboard
};
