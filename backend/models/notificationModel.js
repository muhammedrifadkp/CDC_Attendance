const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'urgent', 'leave', 'announcement'],
    default: 'info'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  targetAudience: {
    type: String,
    enum: ['all_teachers', 'specific_teachers', 'department'],
    default: 'all_teachers'
  },
  targetTeachers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  targetDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: {
    type: Date
  },
  emailRecipients: [{
    email: String,
    name: String,
    status: {
      type: String,
      enum: ['sent', 'failed'],
      default: 'sent'
    }
  }],
  readBy: [{
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  expiresAt: {
    type: Date,
    default: function() {
      // Default expiry: 30 days from creation
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Index for efficient queries
notificationSchema.index({ createdAt: -1 })
notificationSchema.index({ targetAudience: 1 })
notificationSchema.index({ type: 1 })
notificationSchema.index({ priority: 1 })
notificationSchema.index({ active: 1 })
notificationSchema.index({ expiresAt: 1 })

// Virtual for unread count
notificationSchema.virtual('unreadCount').get(function() {
  return this.readBy ? this.readBy.length : 0
})

// Method to mark as read by a teacher
notificationSchema.methods.markAsRead = function(teacherId) {
  const alreadyRead = this.readBy.some(read => read.teacher.toString() === teacherId.toString())
  
  if (!alreadyRead) {
    this.readBy.push({
      teacher: teacherId,
      readAt: new Date()
    })
    return this.save()
  }
  
  return Promise.resolve(this)
}

// Method to check if read by specific teacher
notificationSchema.methods.isReadBy = function(teacherId) {
  return this.readBy.some(read => read.teacher.toString() === teacherId.toString())
}

// Static method to get unread notifications for a teacher
notificationSchema.statics.getUnreadForTeacher = function(teacherId) {
  return this.find({
    active: true,
    expiresAt: { $gt: new Date() },
    $or: [
      { targetAudience: 'all_teachers' },
      { 
        targetAudience: 'specific_teachers',
        targetTeachers: teacherId
      }
    ],
    'readBy.teacher': { $ne: teacherId }
  }).populate('createdBy', 'name email')
    .populate('targetDepartment', 'name')
    .sort({ priority: -1, createdAt: -1 })
}

// Static method to get all notifications for a teacher (read and unread)
notificationSchema.statics.getAllForTeacher = function(teacherId, limit = 50) {
  return this.find({
    active: true,
    expiresAt: { $gt: new Date() },
    $or: [
      { targetAudience: 'all_teachers' },
      { 
        targetAudience: 'specific_teachers',
        targetTeachers: teacherId
      }
    ]
  }).populate('createdBy', 'name email')
    .populate('targetDepartment', 'name')
    .sort({ createdAt: -1 })
    .limit(limit)
}

// Pre-save middleware to set expiry based on priority
notificationSchema.pre('save', function(next) {
  if (this.isNew && !this.expiresAt) {
    const now = new Date()
    switch (this.priority) {
      case 'urgent':
        // Urgent notifications expire in 7 days
        this.expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        break
      case 'high':
        // High priority expires in 14 days
        this.expiresAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
        break
      case 'medium':
        // Medium priority expires in 30 days
        this.expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        break
      case 'low':
        // Low priority expires in 60 days
        this.expiresAt = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
        break
      default:
        this.expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    }
  }
  next()
})

module.exports = mongoose.model('Notification', notificationSchema)
