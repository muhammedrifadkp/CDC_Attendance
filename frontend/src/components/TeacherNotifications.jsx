import { useState, useEffect } from 'react'
import { notificationsAPI } from '../services/api'
import {
  BellIcon,
  XMarkIcon,
  SpeakerWaveIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CalendarDaysIcon,
  MegaphoneIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

const TeacherNotifications = () => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showNotifications, setShowNotifications] = useState(false)
  const [expandedNotification, setExpandedNotification] = useState(null)

  useEffect(() => {
    fetchNotifications()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await notificationsAPI.getTeacherNotifications({ limit: 20 })
      setNotifications(response.data.notifications || [])
      setUnreadCount(response.data.unreadCount || 0)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      // Use fallback data on error
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      await notificationsAPI.markAsRead(notificationId)
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, isRead: true, readAt: new Date() }
            : notification
        )
      )
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const getTypeIcon = (type) => {
    const icons = {
      info: InformationCircleIcon,
      announcement: MegaphoneIcon,
      warning: ExclamationTriangleIcon,
      urgent: SpeakerWaveIcon,
      leave: CalendarDaysIcon
    }
    return icons[type] || InformationCircleIcon
  }

  const getTypeColor = (type, priority) => {
    if (priority === 'urgent') {
      return 'text-red-600 bg-red-100 border-red-200'
    }
    
    const colors = {
      info: 'text-blue-600 bg-blue-100 border-blue-200',
      announcement: 'text-green-600 bg-green-100 border-green-200',
      warning: 'text-yellow-600 bg-yellow-100 border-yellow-200',
      urgent: 'text-red-600 bg-red-100 border-red-200',
      leave: 'text-purple-600 bg-purple-100 border-purple-200'
    }
    return colors[type] || 'text-gray-600 bg-gray-100 border-gray-200'
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60))
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hour${Math.floor(diffInHours) !== 1 ? 's' : ''} ago`
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const unreadNotifications = notifications.filter(n => !n.isRead)
  const hasUnreadUrgent = unreadNotifications.some(n => n.priority === 'urgent')

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className={`relative p-2 rounded-full transition-colors ${
          hasUnreadUrgent 
            ? 'text-red-600 bg-red-100 hover:bg-red-200' 
            : unreadCount > 0 
              ? 'text-cadd-red bg-red-50 hover:bg-red-100' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`}
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className={`absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs font-bold text-white flex items-center justify-center ${
            hasUnreadUrgent ? 'bg-red-600 animate-pulse' : 'bg-cadd-red'
          }`}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-2">
              <BellIcon className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-1 bg-cadd-red text-white text-xs rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <button
              onClick={() => setShowNotifications(false)}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            >
              <XMarkIcon className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cadd-red"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8">
                <BellIcon className="mx-auto h-8 w-8 text-gray-400" />
                <p className="text-gray-500 text-sm mt-2">All caught up!</p>
                <p className="text-gray-400 text-xs">No new notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => {
                  const TypeIcon = getTypeIcon(notification.type)
                  const isExpanded = expandedNotification === notification._id
                  
                  return (
                    <div
                      key={notification._id}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !notification.isRead ? 'bg-blue-50 border-l-4 border-l-cadd-red' : ''
                      }`}
                      onClick={() => {
                        if (!notification.isRead) {
                          markAsRead(notification._id)
                        }
                        setExpandedNotification(isExpanded ? null : notification._id)
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-full ${getTypeColor(notification.type, notification.priority)}`}>
                          <TypeIcon className="h-4 w-4" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-sm font-medium ${
                              !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                            } truncate`}>
                              {notification.title}
                            </h4>
                            <div className="flex items-center space-x-2 ml-2">
                              {notification.priority === 'urgent' && (
                                <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded">
                                  URGENT
                                </span>
                              )}
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-cadd-red rounded-full"></div>
                              )}
                            </div>
                          </div>
                          
                          <p className={`text-xs mt-1 ${
                            isExpanded ? '' : 'line-clamp-2'
                          } ${!notification.isRead ? 'text-gray-700' : 'text-gray-500'}`}>
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-400">
                              {formatDate(notification.createdAt)}
                            </span>
                            {notification.isRead && (
                              <div className="flex items-center text-xs text-gray-400">
                                <CheckIcon className="h-3 w-3 mr-1" />
                                Read
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <div className="text-center">
                <span className="text-xs text-gray-500">
                  {unreadCount === 0 ? 'All caught up! 🎉' : `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </div>
  )
}

export default TeacherNotifications
