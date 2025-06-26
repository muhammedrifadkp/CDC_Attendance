const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Project = require('../models/projectModel');
const ProjectSubmission = require('../models/projectSubmissionModel');
const ProjectAnalytics = require('../models/projectAnalyticsModel');
const Batch = require('../models/batchModel');
const Student = require('../models/studentModel');
const Attendance = require('../models/attendanceModel');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/projects');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for now, can be restricted later
    cb(null, true);
  }
});

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private (Admin/Teacher)
const getProjects = asyncHandler(async (req, res) => {
  const { status, batch, course } = req.query;
  
  let filter = { isActive: true };
  
  if (status) filter.status = status;
  if (batch) filter.batch = batch;
  if (course) filter.course = course;
  
  // If user is teacher, only show projects they created
  if (req.user.role === 'teacher') {
    filter.assignedBy = req.user._id;
  }
  
  const projects = await Project.find(filter)
    .populate('batch', 'name timing section academicYear')
    .populate('course', 'name code')
    .populate('assignedBy', 'name email')
    .populate('submissionCount')
    .sort({ createdAt: -1 });
  
  res.json(projects);
});

// @desc    Get finished batches for project assignment
// @route   GET /api/projects/finished-batches
// @access  Private (Admin/Teacher)
const getFinishedBatches = asyncHandler(async (req, res) => {
  let finishedFilter = { isFinished: true, isArchived: false };
  let activeFilter = { isFinished: false, isArchived: false };

  // If user is teacher, only show batches they created
  if (req.user.role === 'teacher') {
    finishedFilter.createdBy = req.user._id;
    activeFilter.createdBy = req.user._id;
  }

  const [finishedBatches, activeBatches, assignedProjects] = await Promise.all([
    Batch.find(finishedFilter)
      .populate('course', 'name code')
      .populate('students')
      .sort({ endDate: -1 }),
    Batch.find(activeFilter)
      .populate('course', 'name code')
      .populate('students')
      .sort({ startDate: -1 })
      .limit(5), // Only show recent active batches for reference
    // Get all active projects to exclude batches that already have projects
    Project.find({
      isActive: true,
      status: { $in: ['assigned', 'in_progress', 'completed'] }
    }).select('batch')
  ]);

  // Get batch IDs that already have projects assigned
  const batchesWithProjects = new Set(
    assignedProjects.map(project => project.batch.toString())
  );

  console.log(`Found ${finishedBatches.length} finished batches, ${batchesWithProjects.size} already have projects`);

  // Filter out batches that already have projects assigned
  const availableFinishedBatches = finishedBatches.filter(
    batch => !batchesWithProjects.has(batch._id.toString())
  );

  console.log(`${availableFinishedBatches.length} batches available for project assignment`);

  // Add student count to available batches
  const finishedBatchesWithCount = availableFinishedBatches.map(batch => ({
    ...batch.toObject(),
    studentCount: batch.students ? batch.students.length : 0
  }));

  const activeBatchesWithCount = activeBatches.map(batch => ({
    ...batch.toObject(),
    studentCount: batch.students ? batch.students.length : 0
  }));

  // Create informative message
  let message;
  if (finishedBatchesWithCount.length === 0) {
    if (finishedBatches.length === 0) {
      message = 'No finished batches available. Mark a batch as finished to assign projects.';
    } else {
      message = 'All finished batches already have projects assigned. Complete existing projects or finish more batches.';
    }
  } else {
    message = `${finishedBatchesWithCount.length} finished batch(es) available for project assignment.`;
  }

  res.json({
    finishedBatches: finishedBatchesWithCount,
    activeBatches: activeBatchesWithCount,
    message,
    totalFinishedBatches: finishedBatches.length,
    batchesWithProjects: batchesWithProjects.size
  });
});

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
const getProject = asyncHandler(async (req, res) => {
  const projectId = req.params.id;

  // Validate project ID
  if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
    res.status(400);
    throw new Error('Invalid project ID');
  }

  const project = await Project.findById(projectId)
    .populate('batch', 'name timing section academicYear createdBy')
    .populate('course', 'name code')
    .populate('assignedBy', 'name email')
    .populate({
      path: 'submissions',
      populate: {
        path: 'student',
        select: 'name rollNo email studentId'
      }
    });
  
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }
  
  // Check access permissions
  if (req.user.role === 'teacher') {
    // Teachers can access projects if they assigned them OR if the project is for their batch
    const isAssignedByTeacher = project.assignedBy && project.assignedBy.toString() === req.user._id.toString();
    const isBatchOwner = project.batch && project.batch.createdBy && project.batch.createdBy.toString() === req.user._id.toString();

    if (!isAssignedByTeacher && !isBatchOwner) {
      res.status(403);
      throw new Error('Not authorized to access this project');
    }
  }
  
  res.json(project);
});

// @desc    Create new project
// @route   POST /api/projects
// @access  Private (Admin/Teacher)
const createProject = asyncHandler(async (req, res) => {
  console.log('Create project request body:', req.body);
  console.log('User:', req.user?.email, req.user?.role);

  // Destructure request body first
  const {
    title,
    description,
    batch,
    course,
    assignedDate,
    deadlineDate,
    requirements,
    deliverables,
    maxScore,
    weightage,
    instructions,
    resources
  } = req.body;

  // Validate required fields
  if (!title || !description || !batch || !deadlineDate) {
    res.status(400);
    throw new Error('Please provide title, description, batch, and deadline date');
  }
  
  // Validate batch exists and is finished
  const batchDoc = await Batch.findById(batch).populate('course', 'name code');
  if (!batchDoc) {
    res.status(404);
    throw new Error('Batch not found');
  }

  if (!batchDoc.isFinished) {
    res.status(400);
    throw new Error('Project can only be assigned to finished batches. Please mark the batch as finished first from the batch details page.');
  }

  // Auto-set course from batch if not provided
  const projectCourse = course || batchDoc.course._id;
  
  // Check if user has permission to assign to this batch
  if (req.user.role === 'teacher' && batchDoc.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to assign project to this batch');
  }
  
  const project = await Project.create({
    title,
    description,
    batch,
    course: projectCourse,
    assignedDate: assignedDate || new Date(),
    deadlineDate,
    requirements: requirements || [],
    deliverables: deliverables || [],
    maxScore: maxScore || 100,
    weightage: weightage || {
      projectScore: 70,
      attendanceScore: 20,
      submissionTiming: 10
    },
    instructions,
    resources: resources || [],
    assignedBy: req.user._id,
    status: 'assigned'
  });
  
  const populatedProject = await Project.findById(project._id)
    .populate('batch', 'name timing section academicYear')
    .populate('course', 'name code')
    .populate('assignedBy', 'name email');
  
  // Initialize analytics
  await ProjectAnalytics.calculateAnalytics(project._id);
  
  res.status(201).json(populatedProject);
});

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Admin/Teacher)
const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id).populate('batch', 'createdBy');

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  // Check permissions
  if (req.user.role === 'teacher') {
    const isAssignedByTeacher = project.assignedBy && project.assignedBy.toString() === req.user._id.toString();
    const isBatchOwner = project.batch && project.batch.createdBy && project.batch.createdBy.toString() === req.user._id.toString();

    if (!isAssignedByTeacher && !isBatchOwner) {
      res.status(403);
      throw new Error('Not authorized to update this project');
    }
  }
  
  // Prevent updating if submissions exist (except for score and feedback)
  const submissionCount = await ProjectSubmission.countDocuments({ project: req.params.id });
  if (submissionCount > 0) {
    const allowedFields = ['instructions', 'resources', 'status'];
    const updateFields = Object.keys(req.body);
    const hasRestrictedFields = updateFields.some(field => !allowedFields.includes(field));
    
    if (hasRestrictedFields) {
      res.status(400);
      throw new Error('Cannot modify project details after submissions have been made');
    }
  }
  
  const updatedProject = await Project.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  )
    .populate('batch', 'name timing section academicYear')
    .populate('course', 'name code')
    .populate('assignedBy', 'name email');
  
  res.json(updatedProject);
});

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin/Teacher)
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id).populate('batch', 'createdBy');

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  // Check permissions
  if (req.user.role === 'teacher') {
    const isAssignedByTeacher = project.assignedBy && project.assignedBy.toString() === req.user._id.toString();
    const isBatchOwner = project.batch && project.batch.createdBy && project.batch.createdBy.toString() === req.user._id.toString();

    if (!isAssignedByTeacher && !isBatchOwner) {
      res.status(403);
      throw new Error('Not authorized to delete this project');
    }
  }
  
  // Check if submissions exist
  const submissionCount = await ProjectSubmission.countDocuments({ project: req.params.id, isActive: true });

  // For teachers, prevent deletion if submissions exist
  if (req.user.role === 'teacher' && submissionCount > 0) {
    res.status(400);
    throw new Error('Cannot delete project with existing submissions. Contact admin for assistance.');
  }

  // For admins, allow deletion but also mark submissions as inactive
  if (req.user.role === 'admin' && submissionCount > 0) {
    await ProjectSubmission.updateMany(
      { project: req.params.id },
      { isActive: false }
    );
  }

  await Project.findByIdAndUpdate(req.params.id, { isActive: false });

  res.json({
    message: 'Project deleted successfully',
    submissionsRemoved: submissionCount
  });
});

// @desc    Get projects for student
// @route   GET /api/projects/student/:studentId
// @access  Private
const getStudentProjects = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  
  // Get student's batch
  const student = await Student.findById(studentId).populate('batch');
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }
  
  // Get projects for student's batch
  const projects = await Project.find({
    batch: student.batch._id,
    status: { $in: ['assigned', 'in_progress', 'completed'] },
    isActive: true
  })
    .populate('course', 'name code')
    .populate('assignedBy', 'name email')
    .sort({ assignedDate: -1 });
  
  // Get student's submissions for these projects
  const projectIds = projects.map(p => p._id);
  const submissions = await ProjectSubmission.find({
    project: { $in: projectIds },
    student: studentId,
    isActive: true
  });
  
  // Combine project data with submission status
  const projectsWithSubmissions = projects.map(project => {
    const submission = submissions.find(sub => sub.project.toString() === project._id.toString());
    return {
      ...project.toObject(),
      submission: submission || null,
      hasSubmitted: !!submission,
      submissionStatus: submission ? submission.status : 'not_submitted'
    };
  });
  
  res.json(projectsWithSubmissions);
});

// @desc    Get projects for current student
// @route   GET /api/projects/my-projects
// @access  Private (Student)
const getMyProjects = asyncHandler(async (req, res) => {
  // Check if user is a student
  if (req.user.role !== 'student') {
    res.status(403);
    throw new Error('Access denied. Students only.');
  }

  // Get student's batch
  if (!req.user.batch) {
    res.status(400);
    throw new Error('Student is not assigned to any batch');
  }

  // Get projects for student's batch
  const projects = await Project.find({
    batch: req.user.batch,
    status: { $in: ['assigned', 'in_progress', 'completed'] },
    isActive: true
  })
    .populate('course', 'name code')
    .populate('assignedBy', 'name email')
    .populate('batch', 'name')
    .sort({ assignedDate: -1 });

  // Get student's submissions for these projects
  const projectIds = projects.map(p => p._id);
  const submissions = await ProjectSubmission.find({
    project: { $in: projectIds },
    student: req.user._id,
    isActive: true
  });

  // Combine project data with submission status
  const projectsWithSubmissions = projects.map(project => {
    const submission = submissions.find(sub => sub.project.toString() === project._id.toString());
    return {
      ...project.toObject(),
      submissions: submission ? [submission] : []
    };
  });

  res.json(projectsWithSubmissions);
});

// @desc    Submit project
// @route   POST /api/projects/:id/submit
// @access  Private (Student/Teacher)
const submitProject = asyncHandler(async (req, res) => {
  const { description, notes, customSubmissionDate, studentId: providedStudentId } = req.body;
  const projectId = req.params.id;

  const project = await Project.findById(projectId).populate('batch');
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  let studentId;
  let studentRecord;

  if (req.user.role === 'student') {
    // Student submitting their own project
    studentId = req.user._id;

    if (!req.user.batch || req.user.batch.toString() !== project.batch._id.toString()) {
      res.status(403);
      throw new Error('Student not authorized for this project');
    }

    studentRecord = req.user;
  } else if (req.user.role === 'teacher' || req.user.role === 'admin') {
    // Teacher/Admin submitting on behalf of a student
    if (!providedStudentId) {
      res.status(400);
      throw new Error('Student ID is required when submitting on behalf of a student');
    }

    // Find the student record
    const Student = require('../models/studentModel');
    studentRecord = await Student.findById(providedStudentId).populate('batch');
    if (!studentRecord) {
      res.status(404);
      throw new Error('Student not found');
    }

    // Verify student belongs to project batch
    if (!studentRecord.batch || studentRecord.batch._id.toString() !== project.batch._id.toString()) {
      res.status(403);
      throw new Error('Student not authorized for this project');
    }

    studentId = providedStudentId;

    // Additional permission check for teachers
    if (req.user.role === 'teacher') {
      const isAssignedByTeacher = project.assignedBy && project.assignedBy.toString() === req.user._id.toString();
      const isBatchOwner = project.batch && project.batch.createdBy && project.batch.createdBy.toString() === req.user._id.toString();

      if (!isAssignedByTeacher && !isBatchOwner) {
        res.status(403);
        throw new Error('Not authorized to submit for this project');
      }
    }
  } else {
    res.status(403);
    throw new Error('Not authorized to submit projects');
  }

  // Check if already submitted
  const existingSubmission = await ProjectSubmission.findOne({
    project: projectId,
    student: studentId,
    isActive: true
  });

  if (existingSubmission) {
    res.status(400);
    throw new Error('Project already submitted');
  }

  // Process uploaded files
  const files = req.files ? req.files.map(file => ({
    originalName: file.originalname,
    fileName: file.filename,
    filePath: file.path,
    fileSize: file.size,
    fileType: file.mimetype
  })) : [];

  // Calculate attendance score for the student
  const attendanceScore = await calculateStudentAttendanceScore(studentId, project.batch._id);

  // Use custom submission date if provided, otherwise use current date
  const submissionDate = customSubmissionDate ? new Date(customSubmissionDate) : new Date();

  // Calculate timing analysis
  const deadlineDate = new Date(project.deadlineDate);
  const daysFromDeadline = Math.ceil((submissionDate - deadlineDate) / (1000 * 60 * 60 * 24));

  let submissionTiming;
  if (daysFromDeadline < 0) {
    submissionTiming = 'early';
  } else if (daysFromDeadline === 0) {
    submissionTiming = 'on_time';
  } else {
    submissionTiming = 'late';
  }



  const submission = await ProjectSubmission.create({
    project: projectId,
    student: studentId,
    batch: project.batch._id,
    files,
    description,
    notes,
    attendanceScore,
    submittedDate: submissionDate,
    daysFromDeadline,
    submissionTiming
  });

  const populatedSubmission = await ProjectSubmission.findById(submission._id)
    .populate('student', 'name rollNo email studentId')
    .populate('project', 'title maxScore weightage');

  // Update project analytics
  await ProjectAnalytics.calculateAnalytics(projectId);

  res.status(201).json(populatedSubmission);
});

// @desc    Grade project submission
// @route   PUT /api/projects/submissions/:id/grade
// @access  Private (Admin/Teacher)
const gradeSubmission = asyncHandler(async (req, res) => {
  const { score, grade, feedback } = req.body;
  const submissionId = req.params.id;

  // Accept both 'score' and 'grade' for compatibility
  const submissionScore = score || grade;

  const submission = await ProjectSubmission.findById(submissionId)
    .populate({
      path: 'project',
      populate: {
        path: 'batch',
        select: 'createdBy'
      }
    })
    .populate('student');

  if (!submission) {
    res.status(404);
    throw new Error('Submission not found');
  }

  // Check permissions
  if (req.user.role === 'teacher') {
    const isAssignedByTeacher = submission.project.assignedBy && submission.project.assignedBy.toString() === req.user._id.toString();
    const isBatchOwner = submission.project.batch && submission.project.batch.createdBy && submission.project.batch.createdBy.toString() === req.user._id.toString();

    if (!isAssignedByTeacher && !isBatchOwner) {
      res.status(403);
      throw new Error('Not authorized to grade this submission');
    }
  }

  // Calculate final score based on weightage
  const project = submission.project;
  const weightage = project.weightage;

  const projectScoreWeighted = (submissionScore / project.maxScore) * 100 * (weightage.projectScore / 100);
  const attendanceScoreWeighted = submission.attendanceScore * (weightage.attendanceScore / 100);

  // Calculate timing score
  let timingScore = 0;
  if (submission.submissionTiming === 'early') {
    timingScore = 100;
  } else if (submission.submissionTiming === 'on_time') {
    timingScore = 90;
  } else {
    // Late submission - reduce score based on days late
    const daysLate = Math.abs(submission.daysFromDeadline);
    timingScore = Math.max(0, 70 - (daysLate * 10)); // 10 points per day late
  }

  const timingScoreWeighted = timingScore * (weightage.submissionTiming / 100);
  const finalScore = Math.round(projectScoreWeighted + attendanceScoreWeighted + timingScoreWeighted);

  const updatedSubmission = await ProjectSubmission.findByIdAndUpdate(
    submissionId,
    {
      score: submissionScore,
      grade: submissionScore, // For compatibility
      feedback,
      finalScore,
      gradedBy: req.user._id,
      gradedDate: new Date(),
      status: 'graded'
    },
    { new: true }
  )
    .populate('student', 'name rollNo email studentId')
    .populate('project', 'title maxScore weightage')
    .populate('gradedBy', 'name email');

  // Update rankings for all submissions in this project
  await updateProjectRankings(submission.project._id);

  // Update project analytics
  await ProjectAnalytics.calculateAnalytics(submission.project._id);

  res.json(updatedSubmission);
});

// @desc    Get project submissions
// @route   GET /api/projects/:id/submissions
// @access  Private (Admin/Teacher)
const getProjectSubmissions = asyncHandler(async (req, res) => {
  const projectId = req.params.id;
  const { status, sortBy = 'submittedDate', order = 'desc' } = req.query;

  // Validate project ID
  if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
    res.status(400);
    throw new Error('Invalid project ID');
  }

  const project = await Project.findById(projectId).populate('batch', 'createdBy');
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  // Check permissions
  if (req.user.role === 'teacher') {
    const isAssignedByTeacher = project.assignedBy && project.assignedBy.toString() === req.user._id.toString();
    const isBatchOwner = project.batch && project.batch.createdBy && project.batch.createdBy.toString() === req.user._id.toString();

    if (!isAssignedByTeacher && !isBatchOwner) {
      res.status(403);
      throw new Error('Not authorized to view submissions for this project');
    }
  }

  let filter = { project: projectId, isActive: true };
  if (status) filter.status = status;

  const sortOrder = order === 'desc' ? -1 : 1;
  const sortObj = {};
  sortObj[sortBy] = sortOrder;

  const submissions = await ProjectSubmission.find(filter)
    .populate('student', 'name rollNo email studentId')
    .populate('gradedBy', 'name email')
    .sort(sortObj);

  res.json(submissions);
});

// @desc    Get all submissions for teacher/admin
// @route   GET /api/projects/submissions/all
// @access  Private (Admin/Teacher)
const getAllSubmissions = asyncHandler(async (req, res) => {
  const {
    status,
    project,
    timing,
    search,
    sortBy = 'submittedDate',
    order = 'desc'
  } = req.query;

  // Build filter based on user role
  let filter = { isActive: true };

  if (req.user.role === 'teacher') {
    // Get projects assigned by this teacher or for batches they own
    const teacherProjects = await Project.find({
      $or: [
        { assignedBy: req.user._id },
        { 'batch.createdBy': req.user._id }
      ]
    }).populate('batch', 'createdBy');

    const projectIds = teacherProjects.map(p => p._id);
    filter.project = { $in: projectIds };
  }

  // Apply additional filters
  if (status) filter.status = status;
  if (project) filter.project = project;
  if (timing) filter.submissionTiming = timing;

  // Build sort object
  const sortOrder = order === 'desc' ? -1 : 1;
  const sort = { [sortBy]: sortOrder };

  // Get submissions with populated data
  let query = ProjectSubmission.find(filter)
    .populate('student', 'name rollNo email studentId')
    .populate('project', 'title deadlineDate maxScore')
    .populate('gradedBy', 'name email')
    .sort(sort);

  // Apply search if provided
  if (search) {
    const searchRegex = new RegExp(search, 'i');
    const students = await Student.find({
      $or: [
        { name: searchRegex },
        { rollNo: searchRegex },
        { studentId: searchRegex },
        { email: searchRegex }
      ]
    }).select('_id');

    const studentIds = students.map(s => s._id);
    filter.student = { $in: studentIds };
    query = ProjectSubmission.find(filter)
      .populate('student', 'name rollNo email studentId')
      .populate('project', 'title deadlineDate maxScore')
      .populate('gradedBy', 'name email')
      .sort(sort);
  }

  const submissions = await query;

  // Calculate statistics
  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => s.status === 'submitted').length,
    graded: submissions.filter(s => s.status === 'graded').length,
    returned: submissions.filter(s => s.status === 'returned').length,
    underReview: submissions.filter(s => s.status === 'under_review').length
  };

  res.json({
    submissions,
    stats,
    total: submissions.length
  });
});

// @desc    Update submission status
// @route   PUT /api/projects/submissions/:id/status
// @access  Private (Admin/Teacher)
const updateSubmissionStatus = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;
  const submissionId = req.params.id;

  const submission = await ProjectSubmission.findById(submissionId)
    .populate({
      path: 'project',
      populate: {
        path: 'batch',
        select: 'createdBy'
      }
    });

  if (!submission) {
    res.status(404);
    throw new Error('Submission not found');
  }

  // Check permissions
  if (req.user.role === 'teacher') {
    const isAssignedByTeacher = submission.project.assignedBy && submission.project.assignedBy.toString() === req.user._id.toString();
    const isBatchOwner = submission.project.batch && submission.project.batch.createdBy && submission.project.batch.createdBy.toString() === req.user._id.toString();

    if (!isAssignedByTeacher && !isBatchOwner) {
      res.status(403);
      throw new Error('Not authorized to update this submission');
    }
  }

  // Validate status transition
  const validStatuses = ['submitted', 'under_review', 'graded', 'returned', 'resubmitted'];
  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }

  const updatedSubmission = await ProjectSubmission.findByIdAndUpdate(
    submissionId,
    {
      status,
      ...(notes && { notes: notes }),
      ...(status === 'under_review' && { reviewedBy: req.user._id, reviewedDate: new Date() })
    },
    { new: true }
  )
    .populate('student', 'name rollNo email studentId')
    .populate('project', 'title maxScore')
    .populate('gradedBy', 'name email')
    .populate('reviewedBy', 'name email');

  res.json(updatedSubmission);
});

// @desc    Get single submission details
// @route   GET /api/projects/submissions/:id
// @access  Private (Admin/Teacher/Student)
const getSubmissionDetails = asyncHandler(async (req, res) => {
  const submissionId = req.params.id;

  const submission = await ProjectSubmission.findById(submissionId)
    .populate('student', 'name rollNo email studentId')
    .populate('project', 'title description deadlineDate maxScore requirements')
    .populate('gradedBy', 'name email')
    .populate('reviewedBy', 'name email')
    .populate({
      path: 'project',
      populate: {
        path: 'batch',
        select: 'name timing createdBy'
      }
    });

  if (!submission) {
    res.status(404);
    throw new Error('Submission not found');
  }

  // Check permissions
  if (req.user.role === 'student') {
    if (submission.student._id.toString() !== req.user.studentId) {
      res.status(403);
      throw new Error('Not authorized to view this submission');
    }
  } else if (req.user.role === 'teacher') {
    const isAssignedByTeacher = submission.project.assignedBy && submission.project.assignedBy.toString() === req.user._id.toString();
    const isBatchOwner = submission.project.batch && submission.project.batch.createdBy && submission.project.batch.createdBy.toString() === req.user._id.toString();

    if (!isAssignedByTeacher && !isBatchOwner) {
      res.status(403);
      throw new Error('Not authorized to view this submission');
    }
  }

  res.json(submission);
});

// @desc    Mark project as completed
// @route   PUT /api/projects/:id/complete
// @access  Private (Admin/Teacher)
const completeProject = asyncHandler(async (req, res) => {
  const projectId = req.params.id;
  const { completionNotes } = req.body;

  // Validate project ID
  if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
    res.status(400);
    throw new Error('Invalid project ID');
  }

  const project = await Project.findById(projectId).populate('batch', 'createdBy');
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  // Check permissions
  if (req.user.role === 'teacher') {
    const isAssignedByTeacher = project.assignedBy && project.assignedBy.toString() === req.user._id.toString();
    const isBatchOwner = project.batch && project.batch.createdBy && project.batch.createdBy.toString() === req.user._id.toString();

    if (!isAssignedByTeacher && !isBatchOwner) {
      res.status(403);
      throw new Error('Not authorized to complete this project');
    }
  }

  // Check if project can be completed
  if (project.status === 'completed') {
    res.status(400);
    throw new Error('Project is already completed');
  }

  if (project.status === 'archived') {
    res.status(400);
    throw new Error('Cannot complete an archived project');
  }

  // Get project statistics
  const totalSubmissions = await ProjectSubmission.countDocuments({
    project: projectId,
    isActive: true
  });

  const gradedSubmissions = await ProjectSubmission.countDocuments({
    project: projectId,
    status: 'graded',
    isActive: true
  });

  const pendingSubmissions = totalSubmissions - gradedSubmissions;

  // Validate completion criteria
  if (totalSubmissions === 0) {
    res.status(400);
    throw new Error('Cannot complete project with no submissions');
  }

  // For simplified workflow, allow completion with ungraded submissions
  const allowForceComplete = req.body.forceComplete || false;

  if (pendingSubmissions > 0 && !allowForceComplete) {
    res.status(400);
    throw new Error(`Cannot complete project with ${pendingSubmissions} ungraded submissions. Use forceComplete option to complete anyway.`);
  }

  // If force completing, auto-grade ungraded submissions with default score
  if (allowForceComplete && pendingSubmissions > 0) {
    const defaultScore = project.maxScore * 0.8; // 80% default score

    await ProjectSubmission.updateMany(
      {
        project: projectId,
        isActive: true,
        $or: [
          { grade: { $exists: false } },
          { grade: null },
          { status: 'submitted' }
        ]
      },
      {
        grade: defaultScore,
        status: 'graded',
        gradedBy: req.user._id,
        gradedDate: new Date(),
        feedback: 'Auto-graded during project completion'
      }
    );
  }

  // Update project status
  const updatedProject = await Project.findByIdAndUpdate(
    projectId,
    {
      status: 'completed',
      completedDate: new Date(),
      completedBy: req.user._id,
      completionNotes: completionNotes || ''
    },
    { new: true, runValidators: true }
  )
    .populate('batch', 'name timing section academicYear')
    .populate('course', 'name code')
    .populate('assignedBy', 'name email')
    .populate('completedBy', 'name email');

  // Update final project analytics
  await ProjectAnalytics.calculateAnalytics(projectId);

  res.json({
    message: 'Project completed successfully',
    project: updatedProject,
    statistics: {
      totalSubmissions,
      gradedSubmissions,
      completionRate: Math.round((gradedSubmissions / totalSubmissions) * 100)
    }
  });
});

// @desc    Get project completion status
// @route   GET /api/projects/:id/completion-status
// @access  Private (Admin/Teacher)
const getProjectCompletionStatus = asyncHandler(async (req, res) => {
  const projectId = req.params.id;

  // Validate project ID
  if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
    res.status(400);
    throw new Error('Invalid project ID');
  }

  const project = await Project.findById(projectId).populate('batch', 'createdBy');
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  // Check permissions
  if (req.user.role === 'teacher') {
    const isAssignedByTeacher = project.assignedBy && project.assignedBy.toString() === req.user._id.toString();
    const isBatchOwner = project.batch && project.batch.createdBy && project.batch.createdBy.toString() === req.user._id.toString();

    if (!isAssignedByTeacher && !isBatchOwner) {
      res.status(403);
      throw new Error('Not authorized to view completion status for this project');
    }
  }

  // Get detailed statistics
  const totalSubmissions = await ProjectSubmission.countDocuments({
    project: projectId,
    isActive: true
  });

  const gradedSubmissions = await ProjectSubmission.countDocuments({
    project: projectId,
    status: 'graded',
    isActive: true
  });

  const submittedSubmissions = await ProjectSubmission.countDocuments({
    project: projectId,
    status: 'submitted',
    isActive: true
  });

  const underReviewSubmissions = await ProjectSubmission.countDocuments({
    project: projectId,
    status: 'under_review',
    isActive: true
  });

  // Get batch student count for completion rate
  const batchStudentCount = await Student.countDocuments({
    batch: project.batch._id,
    isActive: true
  });

  const canComplete = totalSubmissions > 0 && (gradedSubmissions === totalSubmissions) && project.status !== 'completed' && project.status !== 'archived';

  res.json({
    project: {
      id: project._id,
      title: project.title,
      status: project.status,
      deadlineDate: project.deadlineDate,
      completedDate: project.completedDate,
      completedBy: project.completedBy
    },
    statistics: {
      totalStudents: batchStudentCount,
      totalSubmissions,
      submittedSubmissions,
      underReviewSubmissions,
      gradedSubmissions,
      pendingSubmissions: totalSubmissions - gradedSubmissions,
      submissionRate: batchStudentCount > 0 ? Math.round((totalSubmissions / batchStudentCount) * 100) : 0,
      gradingRate: totalSubmissions > 0 ? Math.round((gradedSubmissions / totalSubmissions) * 100) : 0
    },
    canComplete,
    completionCriteria: {
      hasSubmissions: totalSubmissions > 0,
      allGraded: gradedSubmissions === totalSubmissions,
      notAlreadyCompleted: project.status !== 'completed',
      notArchived: project.status !== 'archived'
    }
  });
});

// @desc    Download submission file
// @route   GET /api/projects/submissions/:id/download/:fileName
// @access  Private (Admin/Teacher)
const downloadSubmissionFile = asyncHandler(async (req, res) => {
  const { id: submissionId, fileName } = req.params;

  const submission = await ProjectSubmission.findById(submissionId)
    .populate({
      path: 'project',
      populate: {
        path: 'batch',
        select: 'createdBy'
      }
    });

  if (!submission) {
    res.status(404);
    throw new Error('Submission not found');
  }

  // Check permissions
  if (req.user.role === 'teacher') {
    const isAssignedByTeacher = submission.project.assignedBy && submission.project.assignedBy.toString() === req.user._id.toString();
    const isBatchOwner = submission.project.batch && submission.project.batch.createdBy && submission.project.batch.createdBy.toString() === req.user._id.toString();

    if (!isAssignedByTeacher && !isBatchOwner) {
      res.status(403);
      throw new Error('Not authorized to download files for this submission');
    }
  }

  // Find the file in submission
  const file = submission.files.find(f => f.fileName === fileName);
  if (!file) {
    res.status(404);
    throw new Error('File not found');
  }

  const path = require('path');
  const fs = require('fs');

  const filePath = path.join(__dirname, '..', file.filePath);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    res.status(404);
    throw new Error('File not found on server');
  }

  // Set headers for file download
  res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
  res.setHeader('Content-Type', file.fileType || 'application/octet-stream');

  // Stream the file
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
});

// Helper function to calculate student attendance score
const calculateStudentAttendanceScore = async (studentId, batchId) => {
  try {
    const attendanceRecords = await Attendance.find({
      student: studentId,
      batch: batchId
    });

    if (attendanceRecords.length === 0) return 0;

    const presentCount = attendanceRecords.filter(record => record.status === 'present').length;
    const attendancePercentage = (presentCount / attendanceRecords.length) * 100;

    return Math.round(attendancePercentage);
  } catch (error) {
    console.error('Error calculating attendance score:', error);
    return 0;
  }
};

// Helper function to update project rankings
const updateProjectRankings = async (projectId) => {
  try {
    const submissions = await ProjectSubmission.find({
      project: projectId,
      finalScore: { $ne: null },
      isActive: true
    }).sort({ finalScore: -1 });

    for (let i = 0; i < submissions.length; i++) {
      await ProjectSubmission.findByIdAndUpdate(submissions[i]._id, {
        rank: i + 1
      });
    }
  } catch (error) {
    console.error('Error updating rankings:', error);
  }
};

// @desc    Remove submission (mark as inactive)
// @route   DELETE /api/projects/submissions/:id
// @access  Private (Admin/Teacher)
const removeSubmission = asyncHandler(async (req, res) => {
  const submissionId = req.params.id;

  const submission = await ProjectSubmission.findById(submissionId)
    .populate({
      path: 'project',
      populate: {
        path: 'batch',
        select: 'createdBy'
      }
    });

  if (!submission) {
    res.status(404);
    throw new Error('Submission not found');
  }

  // Check permissions
  if (req.user.role === 'teacher') {
    const isAssignedByTeacher = submission.project.assignedBy && submission.project.assignedBy.toString() === req.user._id.toString();
    const isBatchOwner = submission.project.batch && submission.project.batch.createdBy && submission.project.batch.createdBy.toString() === req.user._id.toString();

    if (!isAssignedByTeacher && !isBatchOwner) {
      res.status(403);
      throw new Error('Not authorized to remove this submission');
    }
  }

  // Mark as inactive instead of deleting
  await ProjectSubmission.findByIdAndUpdate(submissionId, { isActive: false });

  res.json({ message: 'Submission removed successfully' });
});

module.exports = {
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
};
