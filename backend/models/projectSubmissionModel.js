const mongoose = require('mongoose');

const projectSubmissionSchema = mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Please select a project'],
      ref: 'Project',
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Please select a student'],
      ref: 'Student',
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Please select a batch'],
      ref: 'Batch',
    },
    submittedDate: {
      type: Date,
      required: [true, 'Please add submission date'],
      default: Date.now,
    },
    files: [{
      originalName: {
        type: String,
        required: true,
      },
      fileName: {
        type: String,
        required: true,
      },
      filePath: {
        type: String,
        required: true,
      },
      fileSize: {
        type: Number,
        required: true,
      },
      fileType: {
        type: String,
        required: true,
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    score: {
      type: Number,
      min: [0, 'Score cannot be negative'],
      max: [100, 'Score cannot exceed 100'],
      default: null,
    },
    feedback: {
      type: String,
      trim: true,
      maxlength: [1000, 'Feedback cannot exceed 1000 characters'],
    },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    gradedDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'graded', 'returned', 'resubmitted'],
      default: 'submitted',
    },
    submissionTiming: {
      type: String,
      enum: ['early', 'on_time', 'late'],
      required: true,
    },
    daysFromDeadline: {
      type: Number,
      required: true,
    },
    attendanceScore: {
      type: Number,
      min: [0, 'Attendance score cannot be negative'],
      max: [100, 'Attendance score cannot exceed 100'],
      default: null,
    },
    finalScore: {
      type: Number,
      min: [0, 'Final score cannot be negative'],
      max: [100, 'Final score cannot exceed 100'],
      default: null,
    },
    rank: {
      type: Number,
      min: [1, 'Rank must be at least 1'],
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    previousSubmission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectSubmission',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for submission timing analysis
projectSubmissionSchema.virtual('timingAnalysis').get(function() {
  const daysFromDeadline = this.daysFromDeadline;
  let analysis = '';
  
  if (daysFromDeadline > 0) {
    analysis = `Submitted ${daysFromDeadline} day(s) early`;
  } else if (daysFromDeadline === 0) {
    analysis = 'Submitted on deadline';
  } else {
    analysis = `Submitted ${Math.abs(daysFromDeadline)} day(s) late`;
  }
  
  return analysis;
});

// Virtual for performance grade
projectSubmissionSchema.virtual('performanceGrade').get(function() {
  if (!this.finalScore) return null;
  
  if (this.finalScore >= 90) return 'A+';
  if (this.finalScore >= 80) return 'A';
  if (this.finalScore >= 70) return 'B+';
  if (this.finalScore >= 60) return 'B';
  if (this.finalScore >= 50) return 'C+';
  if (this.finalScore >= 40) return 'C';
  return 'F';
});

// Pre-save middleware to calculate submission timing
projectSubmissionSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const Project = mongoose.model('Project');
      const project = await Project.findById(this.project);
      
      if (project) {
        const submissionDate = new Date(this.submittedDate);
        const deadlineDate = new Date(project.deadlineDate);
        
        // Calculate days from deadline (positive = early, negative = late, 0 = on time)
        const diffTime = deadlineDate - submissionDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        this.daysFromDeadline = diffDays;
        
        // Determine submission timing
        if (diffDays > 0) {
          this.submissionTiming = 'early';
        } else if (diffDays === 0) {
          this.submissionTiming = 'on_time';
        } else {
          this.submissionTiming = 'late';
        }
      }
    } catch (error) {
      console.error('Error calculating submission timing:', error);
    }
  }
  next();
});

// Indexes for efficient queries
projectSubmissionSchema.index({ project: 1, student: 1 }, { unique: true });
projectSubmissionSchema.index({ student: 1 });
projectSubmissionSchema.index({ batch: 1 });
projectSubmissionSchema.index({ status: 1 });
projectSubmissionSchema.index({ submittedDate: 1 });
projectSubmissionSchema.index({ score: 1 });
projectSubmissionSchema.index({ finalScore: 1 });
projectSubmissionSchema.index({ rank: 1 });

// Compound indexes
projectSubmissionSchema.index({ project: 1, status: 1 });
projectSubmissionSchema.index({ batch: 1, finalScore: -1 });
projectSubmissionSchema.index({ project: 1, submittedDate: 1 });

module.exports = mongoose.model('ProjectSubmission', projectSubmissionSchema);
