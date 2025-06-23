const mongoose = require('mongoose');

const studentSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
    },
    studentId: {
      type: String,
      required: [true, 'Please add a student ID'],
      trim: true,
      uppercase: true,
      // Global unique constraint - only admins can set this
    },
    rollNo: {
      type: String,
      required: [true, 'Please add a roll number'],
      trim: true,
      // Index with unique and sparse options defined below
    },
    email: {
      type: String,
      required: false, // Email is now optional
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    phone: {
      type: String,
      required: false, // Phone is now optional
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
    },
    guardianName: {
      type: String,
      trim: true,
    },
    guardianPhone: {
      type: String,
      trim: true,
    },
    emergencyContact: {
      type: String,
      trim: true,
    },
    qualification: {
      type: String,
      trim: true,
    },
    admissionDate: {
      type: Date,
      default: Date.now,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Please select a department'],
      ref: 'Department',
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Please select a course'],
      ref: 'Course',
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Please select a batch'],
      ref: 'Batch',
    },
    feesPaid: {
      type: Number,
      default: 0,
      min: [0, 'Fees paid cannot be negative'],
    },
    totalFees: {
      type: Number,
      default: 0,
      min: [0, 'Total fees cannot be negative'],
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'completed', 'overdue'],
      default: 'pending',
    },
    // Removed duplicate contactInfo - using main email, phone, address fields
    profilePhoto: {
      type: String,
      default: 'default-profile.jpg',
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

// Virtual for attendance
studentSchema.virtual('attendance', {
  ref: 'Attendance',
  localField: '_id',
  foreignField: 'student',
  justOne: false,
});

// Indexes for performance optimization
// Student ID should be globally unique across all students
studentSchema.index({ studentId: 1 }, { unique: true });
// Email should be unique when provided, but allow null values (sparse index)
studentSchema.index({ email: 1 }, { unique: true, sparse: true });
// Roll number should be unique within each batch, not globally
studentSchema.index({ rollNo: 1, batch: 1 }, { unique: true, sparse: true });
studentSchema.index({ department: 1 });
studentSchema.index({ course: 1 });
studentSchema.index({ batch: 1 });
studentSchema.index({ isActive: 1 });
studentSchema.index({ paymentStatus: 1 });
studentSchema.index({ admissionDate: 1 });
studentSchema.index({ name: 1 });

// Compound indexes for common queries
studentSchema.index({ department: 1, course: 1 });
studentSchema.index({ batch: 1, isActive: 1 });
studentSchema.index({ department: 1, isActive: 1 });

module.exports = mongoose.model('Student', studentSchema);
