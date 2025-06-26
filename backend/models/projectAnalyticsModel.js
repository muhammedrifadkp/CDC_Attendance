const mongoose = require('mongoose');

const projectAnalyticsSchema = mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Please select a project'],
      ref: 'Project',
      unique: true,
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Please select a batch'],
      ref: 'Batch',
    },
    totalStudents: {
      type: Number,
      required: true,
      min: [0, 'Total students cannot be negative'],
    },
    submittedCount: {
      type: Number,
      default: 0,
      min: [0, 'Submitted count cannot be negative'],
    },
    pendingCount: {
      type: Number,
      default: 0,
      min: [0, 'Pending count cannot be negative'],
    },
    gradedCount: {
      type: Number,
      default: 0,
      min: [0, 'Graded count cannot be negative'],
    },
    submissionStats: {
      early: {
        type: Number,
        default: 0,
      },
      onTime: {
        type: Number,
        default: 0,
      },
      late: {
        type: Number,
        default: 0,
      },
    },
    scoreStats: {
      average: {
        type: Number,
        default: 0,
        min: [0, 'Average score cannot be negative'],
        max: [100, 'Average score cannot exceed 100'],
      },
      highest: {
        type: Number,
        default: 0,
        min: [0, 'Highest score cannot be negative'],
        max: [100, 'Highest score cannot exceed 100'],
      },
      lowest: {
        type: Number,
        default: 0,
        min: [0, 'Lowest score cannot be negative'],
        max: [100, 'Lowest score cannot exceed 100'],
      },
      median: {
        type: Number,
        default: 0,
        min: [0, 'Median score cannot be negative'],
        max: [100, 'Median score cannot exceed 100'],
      },
    },
    attendanceStats: {
      average: {
        type: Number,
        default: 0,
        min: [0, 'Average attendance cannot be negative'],
        max: [100, 'Average attendance cannot exceed 100'],
      },
      highest: {
        type: Number,
        default: 0,
        min: [0, 'Highest attendance cannot be negative'],
        max: [100, 'Highest attendance cannot exceed 100'],
      },
      lowest: {
        type: Number,
        default: 0,
        min: [0, 'Lowest attendance cannot be negative'],
        max: [100, 'Lowest attendance cannot exceed 100'],
      },
    },
    finalScoreStats: {
      average: {
        type: Number,
        default: 0,
        min: [0, 'Average final score cannot be negative'],
        max: [100, 'Average final score cannot exceed 100'],
      },
      highest: {
        type: Number,
        default: 0,
        min: [0, 'Highest final score cannot be negative'],
        max: [100, 'Highest final score cannot exceed 100'],
      },
      lowest: {
        type: Number,
        default: 0,
        min: [0, 'Lowest final score cannot be negative'],
        max: [100, 'Lowest final score cannot exceed 100'],
      },
    },
    gradeDistribution: {
      aPlus: { type: Number, default: 0 },
      a: { type: Number, default: 0 },
      bPlus: { type: Number, default: 0 },
      b: { type: Number, default: 0 },
      cPlus: { type: Number, default: 0 },
      c: { type: Number, default: 0 },
      f: { type: Number, default: 0 },
    },
    topPerformers: [{
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
      submission: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProjectSubmission',
      },
      finalScore: {
        type: Number,
        min: [0, 'Final score cannot be negative'],
        max: [100, 'Final score cannot exceed 100'],
      },
      rank: {
        type: Number,
        min: [1, 'Rank must be at least 1'],
      },
    }],
    completionRate: {
      type: Number,
      default: 0,
      min: [0, 'Completion rate cannot be negative'],
      max: [100, 'Completion rate cannot exceed 100'],
    },
    onTimeSubmissionRate: {
      type: Number,
      default: 0,
      min: [0, 'On-time submission rate cannot be negative'],
      max: [100, 'On-time submission rate cannot exceed 100'],
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for submission percentage
projectAnalyticsSchema.virtual('submissionPercentage').get(function() {
  if (this.totalStudents === 0) return 0;
  return Math.round((this.submittedCount / this.totalStudents) * 100);
});

// Virtual for grading percentage
projectAnalyticsSchema.virtual('gradingPercentage').get(function() {
  if (this.submittedCount === 0) return 0;
  return Math.round((this.gradedCount / this.submittedCount) * 100);
});

// Virtual for performance summary
projectAnalyticsSchema.virtual('performanceSummary').get(function() {
  return {
    excellent: this.gradeDistribution.aPlus + this.gradeDistribution.a,
    good: this.gradeDistribution.bPlus + this.gradeDistribution.b,
    average: this.gradeDistribution.cPlus + this.gradeDistribution.c,
    poor: this.gradeDistribution.f,
  };
});

// Static method to calculate analytics for a project
projectAnalyticsSchema.statics.calculateAnalytics = async function(projectId) {
  const ProjectSubmission = mongoose.model('ProjectSubmission');
  const Student = mongoose.model('Student');
  const Project = mongoose.model('Project');
  
  try {
    const project = await Project.findById(projectId).populate('batch');
    if (!project) throw new Error('Project not found');
    
    const totalStudents = await Student.countDocuments({ batch: project.batch._id, isActive: true });
    const submissions = await ProjectSubmission.find({ project: projectId, isActive: true });
    
    const submittedCount = submissions.length;
    const pendingCount = totalStudents - submittedCount;
    const gradedCount = submissions.filter(sub => sub.score !== null).length;
    
    // Submission timing stats
    const submissionStats = {
      early: submissions.filter(sub => sub.submissionTiming === 'early').length,
      onTime: submissions.filter(sub => sub.submissionTiming === 'on_time').length,
      late: submissions.filter(sub => sub.submissionTiming === 'late').length,
    };
    
    // Score statistics
    const scores = submissions.filter(sub => sub.score !== null).map(sub => sub.score);
    const attendanceScores = submissions.filter(sub => sub.attendanceScore !== null).map(sub => sub.attendanceScore);
    const finalScores = submissions.filter(sub => sub.finalScore !== null).map(sub => sub.finalScore);
    
    const calculateStats = (arr) => {
      if (arr.length === 0) return { average: 0, highest: 0, lowest: 0, median: 0 };
      const sorted = arr.sort((a, b) => a - b);
      return {
        average: Math.round((arr.reduce((sum, val) => sum + val, 0) / arr.length) * 10) / 10,
        highest: Math.max(...arr),
        lowest: Math.min(...arr),
        median: sorted.length % 2 === 0 
          ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2 
          : sorted[Math.floor(sorted.length / 2)],
      };
    };
    
    const scoreStats = calculateStats(scores);
    const attendanceStats = calculateStats(attendanceScores);
    const finalScoreStats = calculateStats(finalScores);
    
    // Grade distribution
    const gradeDistribution = {
      aPlus: 0, a: 0, bPlus: 0, b: 0, cPlus: 0, c: 0, f: 0
    };
    
    finalScores.forEach(score => {
      if (score >= 90) gradeDistribution.aPlus++;
      else if (score >= 80) gradeDistribution.a++;
      else if (score >= 70) gradeDistribution.bPlus++;
      else if (score >= 60) gradeDistribution.b++;
      else if (score >= 50) gradeDistribution.cPlus++;
      else if (score >= 40) gradeDistribution.c++;
      else gradeDistribution.f++;
    });
    
    // Top performers (top 5)
    const topSubmissions = submissions
      .filter(sub => sub.finalScore !== null)
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 5);
    
    const topPerformers = topSubmissions.map((sub, index) => ({
      student: sub.student,
      submission: sub._id,
      finalScore: sub.finalScore,
      rank: index + 1,
    }));
    
    // Rates
    const completionRate = totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0;
    const onTimeSubmissionRate = submittedCount > 0 
      ? Math.round(((submissionStats.early + submissionStats.onTime) / submittedCount) * 100) 
      : 0;
    
    // Update or create analytics
    const analytics = await this.findOneAndUpdate(
      { project: projectId },
      {
        project: projectId,
        batch: project.batch._id,
        totalStudents,
        submittedCount,
        pendingCount,
        gradedCount,
        submissionStats,
        scoreStats,
        attendanceStats,
        finalScoreStats,
        gradeDistribution,
        topPerformers,
        completionRate,
        onTimeSubmissionRate,
        lastUpdated: new Date(),
      },
      { upsert: true, new: true }
    );
    
    return analytics;
  } catch (error) {
    console.error('Error calculating project analytics:', error);
    throw error;
  }
};

// Indexes for efficient queries
projectAnalyticsSchema.index({ project: 1 });
projectAnalyticsSchema.index({ batch: 1 });
projectAnalyticsSchema.index({ lastUpdated: 1 });

module.exports = mongoose.model('ProjectAnalytics', projectAnalyticsSchema);
