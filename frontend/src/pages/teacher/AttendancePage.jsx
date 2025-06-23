import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ClipboardDocumentCheckIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  EyeIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import { batchesAPI, attendanceAPI, studentsAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { formatDateSimple } from '../../utils/dateUtils'
import { validateApiResponse } from '../../utils/apiValidator'
import BackButton from '../../components/BackButton'
import {
  getBatchStatus,
  sortBatchesByPriority,
  getTimeUntilBatch,
  getCurrentTimeFormatted,
  getCurrentDateFormatted,
  canMarkAttendance,
  getTodaysBatches
} from '../../utils/batchTimeUtils'

const AttendancePage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [batches, setBatches] = useState([])
  const [activeBatch, setActiveBatch] = useState(null)
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [currentTime, setCurrentTime] = useState(getCurrentTimeFormatted())
  const [currentDate, setCurrentDate] = useState(getCurrentDateFormatted())
  const [quickMarkMode, setQuickMarkMode] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchBatches()

    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(getCurrentTimeFormatted())
    }, 1000)

    // Update date every minute (in case it changes at midnight)
    const dateInterval = setInterval(() => {
      setCurrentDate(getCurrentDateFormatted())
    }, 60000)

    return () => {
      clearInterval(timeInterval)
      clearInterval(dateInterval)
    }
  }, [])

  useEffect(() => {
    if (activeBatch) {
      fetchStudents()
      fetchTodayAttendance()
    }
  }, [activeBatch, selectedDate])

  const fetchBatches = async () => {
    try {
      const res = await batchesAPI.getBatches()
      const batchesData = validateApiResponse(res, 'array', [])

      // Filter today's batches and sort by priority
      const todaysBatches = getTodaysBatches(batchesData)
      const sortedBatches = sortBatchesByPriority(todaysBatches)

      setBatches(sortedBatches)

      // Auto-select the first active or starting soon batch
      const priorityBatch = sortedBatches.find(batch => {
        const status = getBatchStatus(batch)
        return ['active', 'starting-soon'].includes(status.status)
      })

      if (priorityBatch && !activeBatch) {
        setActiveBatch(priorityBatch)
      }
    } catch (error) {
      console.error('Error fetching batches:', error)
      toast.error('Failed to load batches')
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    try {
      const res = await studentsAPI.getStudentsByBatch(activeBatch._id, { active: 'true' })
      const studentsData = validateApiResponse(res, 'array', [])
      setStudents(studentsData)
    } catch (error) {
      console.error('Error fetching students:', error)
      toast.error('Failed to load students')
    }
  }

  const fetchTodayAttendance = async () => {
    try {
      const res = await attendanceAPI.getBatchAttendance(activeBatch._id, selectedDate)
      const attendanceData = validateApiResponse(res, 'array', [])
      const attendanceMap = {}
      attendanceData.forEach(record => {
        if (record.attendance) {
          attendanceMap[record.student._id] = record.attendance.status
        }
      })
      setAttendance(attendanceMap)
    } catch (error) {
      console.error('Error fetching attendance:', error)
      // Don't show error for missing attendance data
      setAttendance({})
    }
  }

  const handleAttendanceChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }))
  }

  const handleQuickMarkAll = (status) => {
    const newAttendance = {}
    students.forEach(student => {
      newAttendance[student._id] = status
    })
    setAttendance(newAttendance)
  }

  const handleSubmit = async () => {
    if (!activeBatch) {
      toast.error('Please select a batch')
      return
    }

    setSubmitting(true)
    try {
      const attendanceData = students.map(student => ({
        studentId: student._id,
        status: attendance[student._id] || 'absent'
      }))

      // Mark attendance for each student
      const response = await attendanceAPI.markBulkAttendance({
        batchId: activeBatch._id,
        date: selectedDate,
        attendanceRecords: attendanceData
      })

      // Show success message with lab booking updates if any
      let successMessage = 'Attendance marked successfully!'
      if (response.summary?.labBookingsUpdated > 0) {
        successMessage += ` Lab bookings automatically updated for ${response.summary.labBookingsUpdated} student(s).`
      }

      toast.success(successMessage)

      // Trigger a custom event to notify lab components to refresh
      window.dispatchEvent(new CustomEvent('labAvailabilityUpdate', {
        detail: {
          date: selectedDate,
          updates: response.labBookingUpdates || []
        }
      }))

      // Exit quick mark mode after successful submission
      setQuickMarkMode(false)
    } catch (error) {
      console.error('Error marking attendance:', error)
      toast.error('Failed to mark attendance')
    } finally {
      setSubmitting(false)
    }
  }

  const getAttendanceStats = () => {
    const total = students.length
    const present = students.filter(student => attendance[student._id] === 'present').length
    const absent = students.filter(student => attendance[student._id] === 'absent').length
    const late = students.filter(student => attendance[student._id] === 'late').length
    const notMarked = students.filter(student => !attendance[student._id]).length
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0

    return { total, present, absent, late, notMarked, percentage }
  }

  const stats = getAttendanceStats()

  const getBatchStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'starting-soon': return 'bg-yellow-500'
      case 'recently-ended': return 'bg-orange-500'
      case 'upcoming': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getBatchStatusIcon = (status) => {
    switch (status) {
      case 'active': return <PlayIcon className="h-4 w-4" />
      case 'starting-soon': return <ClockIcon className="h-4 w-4" />
      case 'recently-ended': return <PauseIcon className="h-4 w-4" />
      case 'upcoming': return <ClockIcon className="h-4 w-4" />
      default: return <StopIcon className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent absolute top-0 left-0"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Real-Time Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              <ClipboardDocumentCheckIcon className="inline h-8 w-8 mr-3 text-primary-200" />
              Quick Attendance
            </h1>
            <p className="text-primary-100">Real-time batch attendance marking</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{currentTime}</div>
            <div className="text-sm text-primary-200">{currentDate}</div>
          </div>
        </div>
      </div>

      {/* Today's Batches */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Today's Schedule</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.map(batch => {
            const batchStatus = getBatchStatus(batch)
            const timeInfo = getTimeUntilBatch(batch)
            const isActive = activeBatch?._id === batch._id

            return (
              <div
                key={batch._id}
                className={`relative p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'border-primary-500 bg-primary-50 shadow-lg'
                    : 'border-gray-200 hover:border-primary-300 hover:shadow-md'
                }`}
                onClick={() => setActiveBatch(batch)}
              >
                {/* Status Badge */}
                <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium text-white ${getBatchStatusColor(batchStatus.status)}`}>
                  <div className="flex items-center space-x-1">
                    {getBatchStatusIcon(batchStatus.status)}
                    <span>{batchStatus.label}</span>
                  </div>
                </div>

                <div className="pr-20">
                  <h3 className="font-bold text-gray-900">{batch.name}</h3>
                  <p className="text-sm text-gray-600">Section {batch.section}</p>
                  <p className="text-sm font-medium text-primary-600">{batch.timing}</p>
                  {timeInfo && (
                    <p className="text-xs text-gray-500 mt-1">{timeInfo}</p>
                  )}
                </div>

                {/* Quick Actions */}
                {canMarkAttendance(batch) && (
                  <div className="mt-3 flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveBatch(batch)
                        setQuickMarkMode(true)
                      }}
                      className="flex-1 px-3 py-2 bg-primary-500 text-white text-xs font-medium rounded-lg hover:bg-primary-600 transition-colors"
                    >
                      Quick Mark
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/batches/${batch._id}/attendance/details`)
                      }}
                      className="px-3 py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {batches.length === 0 && (
          <div className="text-center py-8">
            <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No batches found</h3>
            <p className="mt-1 text-sm text-gray-500">No batches scheduled for today.</p>
          </div>
        )}
      </div>

      {/* Quick Attendance Interface */}
      {activeBatch && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">{activeBatch.name} - Section {activeBatch.section}</h3>
                <p className="text-primary-100">{activeBatch.timing} • {formatDateSimple(selectedDate)}</p>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <button
                  onClick={() => setQuickMarkMode(!quickMarkMode)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    quickMarkMode
                      ? 'bg-white text-primary-600'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {quickMarkMode ? 'Exit Quick Mode' : 'Quick Mode'}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Mark All Buttons */}
          {quickMarkMode && (
            <div className="bg-gray-50 px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Mark all students as:</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleQuickMarkAll('present')}
                    className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors"
                  >
                    All Present
                  </button>
                  <button
                    onClick={() => handleQuickMarkAll('absent')}
                    className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
                  >
                    All Absent
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.present}</div>
                <div className="text-xs text-gray-500">Present</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
                <div className="text-xs text-gray-500">Absent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
                <div className="text-xs text-gray-500">Late</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">{stats.percentage}%</div>
                <div className="text-xs text-gray-500">Rate</div>
              </div>
            </div>
          </div>

          {/* Student List */}
          <div className="p-6">
            {students.length === 0 ? (
              <div className="text-center py-12">
                <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
                <p className="mt-1 text-sm text-gray-500">No students enrolled in this batch.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {students.map((student, index) => (
                  <div
                    key={student._id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
                          <span className="text-sm font-bold text-white">
                            {student.name.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-semibold text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-500">
                          {student.rollNo && `Roll: ${student.rollNo}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAttendanceChange(student._id, 'present')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          attendance[student._id] === 'present'
                            ? 'bg-green-500 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-green-100'
                        }`}
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleAttendanceChange(student._id, 'late')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          attendance[student._id] === 'late'
                            ? 'bg-yellow-500 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-yellow-100'
                        }`}
                      >
                        <ClockIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleAttendanceChange(student._id, 'absent')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          attendance[student._id] === 'absent'
                            ? 'bg-red-500 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-red-100'
                        }`}
                      >
                        <XCircleIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save Button */}
          {students.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Saving Attendance...
                  </>
                ) : (
                  <>
                    <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2" />
                    Save Attendance ({stats.present + stats.late + stats.absent}/{stats.total})
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  )
}

export default AttendancePage
