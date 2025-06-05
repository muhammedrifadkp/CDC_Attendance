const express = require('express')
const router = express.Router()
const {
  createNotification,
  getNotifications,
  getTeacherNotifications,
  markNotificationAsRead,
  deleteNotification,
  getNotificationStats
} = require('../controllers/notificationController')
const { protect, admin, teacher } = require('../middleware/authMiddleware')

// Admin routes
router.route('/')
  .post(protect, admin, createNotification)
  .get(protect, admin, getNotifications)

router.get('/stats', protect, admin, getNotificationStats)

// Teacher routes
router.get('/teacher', protect, teacher, getTeacherNotifications)
router.put('/:id/read', protect, teacher, markNotificationAsRead)

// Admin only
router.delete('/:id', protect, admin, deleteNotification)

module.exports = router
