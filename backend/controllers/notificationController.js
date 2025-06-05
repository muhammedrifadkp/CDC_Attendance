const asyncHandler = require('express-async-handler')
const Notification = require('../models/notificationModel')
const User = require('../models/userModel')
const Department = require('../models/departmentModel')
const emailService = require('../utils/emailService')

// @desc    Create and send notification to teachers
// @route   POST /api/notifications
// @access  Private/Admin
const createNotification = asyncHandler(async (req, res) => {
  const {
    title,
    message,
    type = 'info',
    priority = 'medium',
    targetAudience = 'all_teachers',
    targetTeachers = [],
    targetDepartment,
    sendEmail = true
  } = req.body

  // Validate required fields
  if (!title || !message) {
    res.status(400)
    throw new Error('Title and message are required')
  }

  // Validate title and message length
  if (title.length > 200) {
    res.status(400)
    throw new Error('Title must be 200 characters or less')
  }

  if (message.length > 2000) {
    res.status(400)
    throw new Error('Message must be 2000 characters or less')
  }

  try {
    // Create notification
    const notification = await Notification.create({
      title: title.trim(),
      message: message.trim(),
      type,
      priority,
      targetAudience,
      targetTeachers: targetAudience === 'specific_teachers' ? targetTeachers : [],
      targetDepartment: targetAudience === 'department' ? targetDepartment : null,
      createdBy: req.user._id
    })

    // Populate the created notification
    await notification.populate('createdBy', 'name email')
    await notification.populate('targetDepartment', 'name')

    // Get target teachers for email
    let teachersToNotify = []
    
    if (targetAudience === 'all_teachers') {
      teachersToNotify = await User.find({ 
        role: 'teacher', 
        active: true 
      }).select('name email')
    } else if (targetAudience === 'specific_teachers') {
      teachersToNotify = await User.find({ 
        _id: { $in: targetTeachers },
        role: 'teacher', 
        active: true 
      }).select('name email')
    } else if (targetAudience === 'department' && targetDepartment) {
      teachersToNotify = await User.find({ 
        role: 'teacher', 
        department: targetDepartment,
        active: true 
      }).select('name email')
    }

    console.log(`📢 Notification created: "${title}" for ${teachersToNotify.length} teachers`)

    // Send emails if requested
    let emailResults = []
    if (sendEmail && teachersToNotify.length > 0) {
      console.log(`📧 Sending notification emails to ${teachersToNotify.length} teachers...`)
      
      try {
        const emailPromises = teachersToNotify.map(async (teacher) => {
          try {
            const emailResult = await emailService.sendNotificationEmail({
              teacher: {
                name: teacher.name,
                email: teacher.email
              },
              notification: {
                title: notification.title,
                message: notification.message,
                type: notification.type,
                priority: notification.priority,
                createdBy: notification.createdBy.name,
                createdAt: notification.createdAt
              }
            })
            
            return {
              email: teacher.email,
              name: teacher.name,
              status: emailResult.success ? 'sent' : 'failed'
            }
          } catch (error) {
            console.error(`Failed to send email to ${teacher.email}:`, error)
            return {
              email: teacher.email,
              name: teacher.name,
              status: 'failed'
            }
          }
        })

        emailResults = await Promise.all(emailPromises)
        
        // Update notification with email results
        notification.emailSent = emailResults.some(result => result.status === 'sent')
        notification.emailSentAt = new Date()
        notification.emailRecipients = emailResults
        await notification.save()

        const successCount = emailResults.filter(result => result.status === 'sent').length
        const failCount = emailResults.filter(result => result.status === 'failed').length
        
        console.log(`📧 Email results: ${successCount} sent, ${failCount} failed`)
        
      } catch (error) {
        console.error('Error sending notification emails:', error)
      }
    }

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      notification: {
        _id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        targetAudience: notification.targetAudience,
        createdBy: notification.createdBy,
        createdAt: notification.createdAt,
        emailSent: notification.emailSent,
        emailSentAt: notification.emailSentAt
      },
      emailResults: {
        total: teachersToNotify.length,
        sent: emailResults.filter(r => r.status === 'sent').length,
        failed: emailResults.filter(r => r.status === 'failed').length
      }
    })

  } catch (error) {
    console.error('Error creating notification:', error)
    res.status(500)
    throw new Error('Failed to create notification')
  }
})

// @desc    Get all notifications (Admin view)
// @route   GET /api/notifications
// @access  Private/Admin
const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type, priority } = req.query

  const filter = { active: true }
  if (type) filter.type = type
  if (priority) filter.priority = priority

  const notifications = await Notification.find(filter)
    .populate('createdBy', 'name email')
    .populate('targetDepartment', 'name')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)

  const total = await Notification.countDocuments(filter)

  res.json({
    notifications,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  })
})

// @desc    Get notifications for teacher (Dashboard)
// @route   GET /api/notifications/teacher
// @access  Private/Teacher
const getTeacherNotifications = asyncHandler(async (req, res) => {
  const { unreadOnly = false, limit = 50 } = req.query
  const teacherId = req.user._id

  let notifications
  if (unreadOnly === 'true') {
    notifications = await Notification.getUnreadForTeacher(teacherId)
  } else {
    notifications = await Notification.getAllForTeacher(teacherId, parseInt(limit))
  }

  // Add read status for each notification
  const notificationsWithReadStatus = notifications.map(notification => ({
    ...notification.toObject(),
    isRead: notification.isReadBy(teacherId),
    readAt: notification.readBy.find(read => read.teacher.toString() === teacherId.toString())?.readAt
  }))

  res.json({
    notifications: notificationsWithReadStatus,
    unreadCount: notifications.filter(n => !n.isReadBy(teacherId)).length
  })
})

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private/Teacher
const markNotificationAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id)

  if (!notification) {
    res.status(404)
    throw new Error('Notification not found')
  }

  await notification.markAsRead(req.user._id)

  res.json({
    success: true,
    message: 'Notification marked as read'
  })
})

// @desc    Delete notification (Admin only)
// @route   DELETE /api/notifications/:id
// @access  Private/Admin
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id)

  if (!notification) {
    res.status(404)
    throw new Error('Notification not found')
  }

  // Soft delete by setting active to false
  notification.active = false
  await notification.save()

  res.json({
    success: true,
    message: 'Notification deleted successfully'
  })
})

// @desc    Get notification statistics (Admin)
// @route   GET /api/notifications/stats
// @access  Private/Admin
const getNotificationStats = asyncHandler(async (req, res) => {
  const stats = await Notification.aggregate([
    { $match: { active: true } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        byType: {
          $push: {
            type: '$type',
            count: 1
          }
        },
        byPriority: {
          $push: {
            priority: '$priority',
            count: 1
          }
        },
        emailsSent: {
          $sum: {
            $cond: ['$emailSent', 1, 0]
          }
        }
      }
    }
  ])

  const recentNotifications = await Notification.find({ active: true })
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 })
    .limit(5)
    .select('title type priority createdAt createdBy')

  res.json({
    stats: stats[0] || { total: 0, emailsSent: 0 },
    recentNotifications
  })
})

module.exports = {
  createNotification,
  getNotifications,
  getTeacherNotifications,
  markNotificationAsRead,
  deleteNotification,
  getNotificationStats
}
