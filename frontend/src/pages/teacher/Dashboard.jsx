import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { batchesAPI, studentsAPI, notificationsAPI, attendanceAPI } from '../../services/api'
import {
  PlusIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  AcademicCapIcon,
  ChartBarIcon,
  ComputerDesktopIcon,
  ClockIcon,
  CheckCircleIcon,
  BellIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../../context/AuthContext'
import { formatDateSimple } from '../../utils/dateUtils'
import BackButton from '../../components/BackButton'
import NotificationCenter from '../../components/dashboard/NotificationCenter'

const TeacherDashboard = () => {
  const { user } = useAuth()
  const [batches, setBatches] = useState([])
  const [stats, setStats] = useState({
    totalBatches: 0,
    activeBatches: 0,
    finishedBatches: 0,
    totalStudents: 0,
    todayAttendance: 0,
    activeClasses: 0,
    loading: true
  })
  const [notifications, setNotifications] = useState({
    unreadCount: 0,
    recent: [],
    loading: true,
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [batchesRes, notificationsRes, todayAttendanceRes] = await Promise.all([
          batchesAPI.getBatches(),
          notificationsAPI.getTeacherNotifications({ unreadOnly: true }).catch(err => {
            console.error('Notifications API error:', err)
            return { data: { notifications: [], unreadCount: 0 } }
          }),
          attendanceAPI.getTodayAttendanceSummary().catch(err => {
            console.error('Today attendance API error:', err)
            return { data: { totalStudents: 0, presentToday: 0, attendanceRate: 0 } }
          })
        ])

        const batchesData = batchesRes.data
        const todayAttendanceData = todayAttendanceRes.data

        setBatches(batchesData)

        // Calculate stats from real data
        const totalBatches = batchesData.length
        const totalStudents = batchesData.reduce((sum, batch) => sum + (batch.studentCount || 0), 0)

        // Calculate average attendance percentage (more accurate)
        const avgAttendancePercentage = batchesData.length > 0
          ? Math.round((batchesData.reduce((sum, batch) => sum + (batch.attendancePercentage || 0), 0) / batchesData.length) * 10) / 10
          : 0

        // Use real today's attendance data from the API
        const todayAttendance = todayAttendanceData.presentToday || 0

        // Calculate active and finished batches
        const activeBatches = batchesData.filter(batch => !batch.isFinished && !batch.isArchived)
        const finishedBatches = batchesData.filter(batch => batch.isFinished)
        const activeClasses = activeBatches.length

        setStats({
          totalBatches,
          activeBatches: activeBatches.length,
          finishedBatches: finishedBatches.length,
          totalStudents,
          todayAttendance,
          activeClasses,
          loading: false
        })

        // Update notifications state
        setNotifications({
          unreadCount: notificationsRes.data.unreadCount || 0,
          recent: [],
          loading: false,
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setStats(prev => ({ ...prev, loading: false }))
      }
    }

    fetchData()
  }, [])

  const statsCards = [
    {
      name: 'Active Batches',
      count: stats.activeBatches,
      icon: AcademicCapIcon,
      gradient: 'from-blue-500 to-blue-600',
      link: '/batches',
      description: 'Currently running batches'
    },
    {
      name: 'Finished Batches',
      count: stats.finishedBatches,
      icon: CheckCircleIcon,
      gradient: 'from-green-500 to-green-600',
      link: '/batches',
      description: 'Completed batches'
    },
    {
      name: 'Total Students',
      count: stats.totalStudents,
      icon: UserGroupIcon,
      gradient: 'from-purple-500 to-purple-600',
      link: '/batches',
      description: 'Enrolled learners'
    },
    {
      name: 'Today\'s Attendance',
      count: stats.todayAttendance,
      icon: ClipboardDocumentCheckIcon,
      gradient: 'from-cadd-red to-cadd-pink',
      link: '/attendance',
      description: 'Students present today'
    },
    {
      name: 'Notifications',
      count: notifications.unreadCount,
      icon: BellIcon,
      gradient: notifications.unreadCount > 0 ? 'from-red-500 to-red-600' : 'from-gray-500 to-gray-600',
      link: '/notifications',
      description: notifications.unreadCount > 0 ? 'Unread notifications' : 'All caught up!'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <div className="flex items-center">
        <BackButton />
      </div>

      {/* Welcome Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-cadd-red/10 to-cadd-pink/10"></div>
        <div className="relative px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Welcome back, <span className="text-cadd-yellow">{user?.name}</span>
              </h1>
              <p className="text-xl text-gray-300 mb-4">
                CADD Centre Teacher Dashboard
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  System Online
                </span>
                <span className="flex items-center">
                  <ClockIcon className="w-4 h-4 mr-1" />
                  {formatDateSimple(new Date())}
                </span>
              </div>
            </div>
            <div className="hidden lg:block">
              <img
                className="h-20 w-auto opacity-80"
                src="/logos/cdc_logo.png"
                alt="CDC"
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - Responsive */}
{stats.loading ? (
  <div className="flex items-center justify-center min-h-64">
    <div className="relative">
      <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-gray-200"></div>
      <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-cadd-red border-t-transparent absolute top-0 left-0"></div>
    </div>
  </div>
) : (
  <div className="grid grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
    {statsCards.map((card, index) => (
      <Link
        key={card.name}
        to={card.link}
        className="group relative bg-white rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg sm:hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.03] sm:hover:scale-105 overflow-hidden animate-slide-up"
        style={{ animationDelay: `${index * 100}ms` }}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
        <div className="relative p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div className="flex-1 mb-3 sm:mb-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">{card.name}</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">{card.count}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">{card.description}</p>
            </div>
            <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br ${card.gradient} shadow-md sm:shadow-lg`}>
              <card.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
          <div className="mt-3 sm:mt-4 flex items-center text-xs sm:text-sm text-gray-500">
            <ChartBarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            <span>View details</span>
          </div>
        </div>
      </Link>
    ))}
  </div>
)}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Batches Section - Takes 2 columns */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Your Batches</h2>
              <p className="text-sm text-gray-500 mt-1">Manage your teaching groups and track progress</p>
            </div>
            <Link
              to="/batches/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-cadd-red to-cadd-pink hover:from-cadd-pink hover:to-cadd-red transition-all duration-300 transform hover:scale-105"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              New Batch
            </Link>
          </div>
        </div>

        <div className="p-6">
          {batches.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserGroupIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No batches yet</h3>
              <p className="text-gray-600 mb-6">
                Get started by creating your first batch to manage students and track attendance.
              </p>
              <Link
                to="/batches/new"
                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-cadd-red to-cadd-pink hover:from-cadd-pink hover:to-cadd-red transition-all duration-300"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Create Your First Batch
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {batches.map((batch, index) => (
                <div
                  key={batch._id}
                  className="group relative bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cadd-red/5 to-cadd-pink/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative p-6">
                    <div className="flex items-center mb-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                        <AcademicCapIcon className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-cadd-red transition-colors duration-300">
                          {batch.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {batch.academicYear} • {batch.section}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900">{batch.studentCount || 0}</p>
                        <p className="text-xs text-gray-500">Students</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          {batch.attendancePercentage ? `${batch.attendancePercentage}%` : '0%'}
                        </p>
                        <p className="text-xs text-gray-500">Avg Attendance</p>
                        <p className="text-xs text-gray-400 mt-1">(Last 30 days)</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        to={`/batches/${batch._id}/students`}
                        className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                      >
                        <UserGroupIcon className="h-4 w-4 mr-1" />
                        Students
                      </Link>
                      <Link
                        to={`/batches/${batch._id}/attendance`}
                        className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition-all duration-200"
                      >
                        <ClipboardDocumentCheckIcon className="h-4 w-4 mr-1" />
                        Attendance
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
          </div>
        </div>

        {/* Notification Center - Takes 1 column */}
        <div className="lg:col-span-1">
          <NotificationCenter
            unreadCount={notifications.unreadCount}
            onUnreadCountChange={(count) => setNotifications(prev => ({ ...prev, unreadCount: count }))}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
          <p className="text-sm text-gray-500 mt-1">Frequently used features for efficient teaching</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              to="/attendance"
              className="group relative bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 hover:shadow-lg transition-all duration-300 transform hover:scale-105 border border-green-100"
            >
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                  <ClipboardDocumentCheckIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                    Today's Attendance
                  </h3>
                  <p className="text-sm text-gray-600">Mark attendance for your batches</p>
                </div>
              </div>
              <div className="flex items-center text-sm text-green-600 font-medium">
                <span>Go to Attendance</span>
                <ChartBarIcon className="h-4 w-4 ml-2" />
              </div>
            </Link>

            <Link
              to="/batches"
              className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 hover:shadow-lg transition-all duration-300 transform hover:scale-105 border border-blue-100"
            >
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                  <AcademicCapIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                    Manage Batches
                  </h3>
                  <p className="text-sm text-gray-600">Create and manage your teaching groups</p>
                </div>
              </div>
              <div className="flex items-center text-sm text-blue-600 font-medium">
                <span>View Batches</span>
                <ChartBarIcon className="h-4 w-4 ml-2" />
              </div>
            </Link>

            <Link
              to="/lab-availability"
              className="group relative bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 hover:shadow-lg transition-all duration-300 transform hover:scale-105 border border-purple-100"
            >
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg">
                  <ComputerDesktopIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                    Lab Availability
                  </h3>
                  <p className="text-sm text-gray-600">Check computer lab schedules</p>
                </div>
              </div>
              <div className="flex items-center text-sm text-purple-600 font-medium">
                <span>Check Availability</span>
                <ChartBarIcon className="h-4 w-4 ml-2" />
              </div>
            </Link>

            <Link
              to="/batches"
              className="group relative bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 hover:shadow-lg transition-all duration-300 transform hover:scale-105 border border-orange-100"
            >
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg">
                  <UserIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-orange-700 transition-colors">
                    Download Attendance
                  </h3>
                  <p className="text-sm text-gray-600">Export your attendance sheets to Excel</p>
                </div>
              </div>
              <div className="flex items-center text-sm text-orange-600 font-medium">
                <span>Go to Batches</span>
                <UserIcon className="h-4 w-4 ml-2" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeacherDashboard
