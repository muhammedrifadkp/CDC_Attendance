const mongoose = require('mongoose');

const projectSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a project title'],
      trim: true,
      maxlength: [200, 'Project title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please add a project description'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Please select a batch'],
      ref: 'Batch',
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Please select a course'],
      ref: 'Course',
    },
    assignedDate: {
      type: Date,
      required: [true, 'Please add assignment date'],
      default: Date.now,
    },
    deadlineDate: {
      type: Date,
      required: [true, 'Please add deadline date'],
      validate: {
        validator: function(value) {
          return value > this.assignedDate;
        },
        message: 'Deadline date must be after assignment date',
      },
    },
    requirements: [{
      title: {
        type: String,
        required: true,
        trim: true,
      },
      description: {
        type: String,
        trim: true,
      },
      mandatory: {
        type: Boolean,
        default: true,
      },
    }],
    deliverables: [{
      name: {
        type: String,
        required: true,
        trim: true,
      },
      fileType: {
        type: String,
        enum: ['document', 'code', 'presentation', 'video', 'image', 'any'],
        default: 'any',
      },
      maxSize: {
        type: Number, // in MB
        default: 50,
      },
      mandatory: {
        type: Boolean,
        default: true,
      },
    }],
    maxScore: {
      type: Number,
      required: [true, 'Please add maximum score'],
      min: [1, 'Maximum score must be at least 1'],
      max: [100, 'Maximum score cannot exceed 100'],
      default: 100,
    },
    weightage: {
      projectScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 70, // 70% weightage for project score
      },
      attendanceScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 20, // 20% weightage for attendance
      },
      submissionTiming: {
        type: Number,
        min: 0,
        max: 100,
        default: 10, // 10% weightage for submission timing
      },
    },
    status: {
      type: String,
      enum: ['draft', 'assigned', 'in_progress', 'completed', 'archived'],
      default: 'draft',
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    instructions: {
      type: String,
      trim: true,
      maxlength: [1000, 'Instructions cannot exceed 1000 characters'],
    },
    resources: [{
      title: {
        type: String,
        required: true,
        trim: true,
      },
      url: {
        type: String,
        trim: true,
      },
      description: {
        type: String,
        trim: true,
      },
    }],
    completedDate: {
      type: Date,
      default: null,
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    completionNotes: {
      type: String,
      trim: true,
      maxlength: [500, 'Completion notes cannot exceed 500 characters'],
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

// Virtual for submissions
projectSchema.virtual('submissions', {
  ref: 'ProjectSubmission',
  localField: '_id',
  foreignField: 'project',
  justOne: false,
});

// Virtual for submission count
projectSchema.virtual('submissionCount', {
  ref: 'ProjectSubmission',
  localField: '_id',
  foreignField: 'project',
  count: true,
});

// Virtual for days remaining
projectSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const deadline = new Date(this.deadlineDate);
  const diffTime = deadline - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for project duration
projectSchema.virtual('projectDuration').get(function() {
  const assigned = new Date(this.assignedDate);
  const deadline = new Date(this.deadlineDate);
  const diffTime = deadline - assigned;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Indexes for efficient queries
projectSchema.index({ batch: 1, status: 1 });
projectSchema.index({ assignedBy: 1 });
projectSchema.index({ deadlineDate: 1 });
projectSchema.index({ course: 1 });
projectSchema.index({ status: 1, isActive: 1 });

// Compound indexes
projectSchema.index({ batch: 1, assignedDate: 1 });
projectSchema.index({ status: 1, deadlineDate: 1 });

module.exports = mongoose.model('Project', projectSchema);
