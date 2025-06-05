import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { notificationsAPI } from '../../../services/api'
import {
  PlusIcon,
  SpeakerWaveIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CalendarDaysIcon,
  MegaphoneIcon,
  TrashIcon,
  EnvelopeIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  UsersIcon
} from '@heroicons/react/24/outline'

const NotificationsList = () => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [filters, setFilters] = useState({
    type: '',
    priority: ''
  })

  useEffect(() => {
    fetchNotifications()
    fetchStats()
  }, [filters])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await notificationsAPI.getNotifications(filters)
      setNotifications(response.data.notifications || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast.error('Failed to fetch notifications')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await notificationsAPI.getNotificationStats()
      setStats(response.data.stats)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) {
      return
    }

    try {
      await notificationsAPI.deleteNotification(id)
      toast.success('Notification deleted successfully')
      fetchNotifications()
      fetchStats()
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Failed to delete notification')
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

  const getTypeColor = (type) => {
    const colors = {
      info: 'text-blue-600 bg-blue-100',
      announcement: 'text-green-600 bg-green-100',
      warning: 'text-yellow-600 bg-yellow-100',
      urgent: 'text-red-600 bg-red-100',
      leave: 'text-purple-600 bg-purple-100'
    }
    return colors[type] || 'text-gray-600 bg-gray-100'
  }

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-gray-600 bg-gray-100',
      medium: 'text-blue-600 bg-blue-100',
      high: 'text-orange-600 bg-orange-100',
      urgent: 'text-red-600 bg-red-100'
    }
    return colors[priority] || 'text-gray-600 bg-gray-100'
  }

  const getAudienceIcon = (audience) => {
    const icons = {
      all_teachers: UserGroupIcon,
      department: BuildingOfficeIcon,
      specific_teachers: UsersIcon
    }
    return icons[audience] || UserGroupIcon
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cadd-red"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teacher Notifications</h1>
          <p className="text-gray-600">
            Send announcements, leave notices, and important updates to teachers
          </p>
        </div>
        <Link
          to="/admin/notifications/new"
          className="flex items-center px-4 py-2 bg-gradient-to-r from-cadd-red to-cadd-pink text-white rounded-lg hover:from-cadd-pink hover:to-cadd-red transition-all duration-300 shadow-lg"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Send Notification
        </Link>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <SpeakerWaveIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Notifications</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <EnvelopeIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Emails Sent</p>
                <p className="text-2xl font-bold text-gray-900">{stats.emailsSent || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <UserGroupIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Recent Activity</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.recentNotifications?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="info">Information</option>
              <option value="announcement">Announcement</option>
              <option value="warning">Warning</option>
              <option value="urgent">Urgent</option>
              <option value="leave">Leave Notice</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Priority
            </label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent"
            >
              <option value="">All Priorities</option>
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <SpeakerWaveIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by sending your first notification to teachers.
            </p>
            <div className="mt-6">
              <Link
                to="/admin/notifications/new"
                className="inline-flex items-center px-4 py-2 bg-cadd-red text-white rounded-lg hover:bg-cadd-red/90"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Send Notification
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => {
              const TypeIcon = getTypeIcon(notification.type)
              const AudienceIcon = getAudienceIcon(notification.targetAudience)
              
              return (
                <div key={notification._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className={`p-2 rounded-full ${getTypeColor(notification.type)}`}>
                          <TypeIcon className="h-4 w-4" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {notification.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(notification.priority)}`}>
                          {notification.priority.toUpperCase()}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center">
                          <AudienceIcon className="h-4 w-4 mr-1" />
                          <span>
                            {notification.targetAudience === 'all_teachers' && 'All Teachers'}
                            {notification.targetAudience === 'department' && `${notification.targetDepartment?.name || 'Department'}`}
                            {notification.targetAudience === 'specific_teachers' && `${notification.targetTeachers?.length || 0} Teachers`}
                          </span>
                        </div>
                        
                        <div className="flex items-center">
                          <EnvelopeIcon className="h-4 w-4 mr-1" />
                          <span>{notification.emailSent ? 'Email Sent' : 'No Email'}</span>
                        </div>
                        
                        <div>
                          <span>By {notification.createdBy?.name}</span>
                        </div>
                        
                        <div>
                          <span>{formatDate(notification.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleDelete(notification._id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete notification"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default NotificationsList
