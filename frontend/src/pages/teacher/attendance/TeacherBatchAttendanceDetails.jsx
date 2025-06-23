import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { 
  batchesAPI, 
  studentsAPI, 
  attendanceAPI 
} from '../../../services/api'
import {
  UserIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import { formatDateSimple } from '../../../utils/dateUtils'
import BackButton from '../../../components/BackButton'

const TeacherBatchAttendanceDetails = () => {
  const { batchId } = useParams()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [batch, setBatch] = useState(null)
  const [students, setStudents] = useState([])
  const [attendanceData, setAttendanceData] = useState({})
  const [batchStats, setBatchStats] = useState(null)
  const [last10Days, setLast10Days] = useState([])

  useEffect(() => {
    fetchBatchDetails()
  }, [batchId])

  const fetchBatchDetails = async () => {
    try {
      setLoading(true)
      
      // Generate last 10 days
      const days = []
      for (let i = 9; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        days.push(date.toISOString().split('T')[0])
      }
      setLast10Days(days)

      // Fetch batch details, students, and stats
      const [batchRes, studentsRes, statsRes] = await Promise.all([
        batchesAPI.getBatchById(batchId),
        studentsAPI.getStudentsByBatch(batchId, { active: 'true' }),
        batchesAPI.getBatchStats(batchId)
      ])

      setBatch(batchRes.data)
      setStudents(Array.isArray(studentsRes.data) ? studentsRes.data : [])
      setBatchStats(statsRes.data)

      // Fetch attendance data for last 10 days
      const attendancePromises = days.map(date => 
        attendanceAPI.getBatchAttendance(batchId, date)
          .then(res => ({ date, data: res.data }))
          .catch(err => ({ date, data: [] }))
      )

      const attendanceResults = await Promise.all(attendancePromises)
      const attendanceMap = {}
      
      attendanceResults.forEach(({ date, data }) => {
        attendanceMap[date] = {}
        data.forEach(record => {
          if (record.student && record.attendance) {
            attendanceMap[date][record.student._id] = record.attendance.status
          }
        })
      })

      setAttendanceData(attendanceMap)
    } catch (error) {
      console.error('Error fetching batch details:', error)
      toast.error('Failed to load batch details')
      navigate('/batches')
    } finally {
      setLoading(false)
    }
  }

  const getAttendanceStatus = (studentId, date) => {
    return attendanceData[date]?.[studentId] || 'not-marked'
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      case 'absent':
        return <XCircleIcon className="h-4 w-4 text-red-500" />
      case 'late':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />
      default:
        return <ExclamationTriangleIcon className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'present': return 'P'
      case 'absent': return 'A'
      case 'late': return 'L'
      default: return '-'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800'
      case 'absent': return 'bg-red-100 text-red-800'
      case 'late': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-500'
    }
  }

  const calculateStudentAttendanceRate = (studentId) => {
    let totalDays = 0
    let presentDays = 0
    
    last10Days.forEach(date => {
      const status = getAttendanceStatus(studentId, date)
      if (status !== 'not-marked') {
        totalDays++
        if (status === 'present' || status === 'late') {
          presentDays++
        }
      }
    })
    
    return totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!batch) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Batch Not Found</h2>
          <button
            onClick={() => navigate('/batches')}
            className="text-primary-600 hover:text-primary-700"
          >
            Back to Batches
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 sm:px-6 lg:px-8">
        {/* Back Button - Mobile Only */}
        <div className="mb-4 sm:mb-6 block sm:hidden">
          <BackButton />
        </div>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg">
                <AcademicCapIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{batch.name}</h1>
                <p className="text-sm text-gray-600">
                  {batch.academicYear} • Section {batch.section} • {batch.timing}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/batches')}
              className="hidden sm:inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back
            </button>
          </div>

          {/* Batch Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {batch.course && (
              <>
                <div className="flex items-center space-x-2">
                  <AcademicCapIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Course</p>
                    <p className="font-medium text-gray-900">{batch.course.name}</p>
                  </div>
                </div>
                {batch.course.department && (
                  <div className="flex items-center space-x-2">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Department</p>
                      <p className="font-medium text-gray-900">{batch.course.department.name}</p>
                    </div>
                  </div>
                )}
              </>
            )}
            {batch.createdBy && (
              <div className="flex items-center space-x-2">
                <UserIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Teacher</p>
                  <p className="font-medium text-gray-900">{batch.createdBy.name}</p>
                </div>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <UserGroupIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Students</p>
                <p className="font-medium text-gray-900">{students.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {batchStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <UserGroupIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-xs text-gray-500">Total Students</p>
                  <p className="text-lg font-bold text-gray-900">{batchStats.stats?.students?.total || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-xs text-gray-500">Attendance Rate</p>
                  <p className="text-lg font-bold text-gray-900">{batchStats.stats?.attendance?.rate || 0}%</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <ClockIcon className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <p className="text-xs text-gray-500">Capacity</p>
                  <p className="text-lg font-bold text-gray-900">{batchStats.stats?.students?.utilization || 0}%</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <ChartBarIcon className="h-5 w-5 text-purple-600" />
                </div>
                <div className="ml-3">
                  <p className="text-xs text-gray-500">Records</p>
                  <p className="text-lg font-bold text-gray-900">{batchStats.stats?.attendance?.total || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Attendance Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Student Attendance - Last 10 Days</h2>
            <p className="text-sm text-gray-600 mt-1">P = Present, A = Absent, L = Late, - = Not Marked</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="sticky left-0 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Student
                  </th>
                  {last10Days.map(date => (
                    <th key={date} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[60px]">
                      <div className="flex flex-col items-center">
                        <span>{formatDateSimple(date).split(' ')[0]}</span>
                        <span className="text-[10px] text-gray-400">{formatDateSimple(date).split(' ')[1]}</span>
                      </div>
                    </th>
                  ))}
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student, index) => {
                  const attendanceRate = calculateStudentAttendanceRate(student._id)
                  return (
                    <tr key={student._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="sticky left-0 bg-inherit px-6 py-4 whitespace-nowrap border-r border-gray-200">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                              <span className="text-xs font-medium text-white">
                                {student.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            <div className="text-xs text-gray-500">Roll: {student.rollNo}</div>
                          </div>
                        </div>
                      </td>
                      {last10Days.map(date => {
                        const status = getAttendanceStatus(student._id, date)
                        return (
                          <td key={date} className="px-3 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${getStatusColor(status)}`}>
                              {getStatusText(status)}
                            </span>
                          </td>
                        )
                      })}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          attendanceRate >= 80 ? 'bg-green-100 text-green-800' :
                          attendanceRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {attendanceRate}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {students.length === 0 && (
            <div className="text-center py-12">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
              <p className="mt-1 text-sm text-gray-500">This batch doesn't have any students yet.</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate(`/batches/${batchId}/attendance`)}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-300 shadow-lg"
          >
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            Mark Attendance
          </button>
          <button
            onClick={() => navigate(`/batches/${batchId}/attendance/report`)}
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-300 shadow-md"
          >
            <ChartBarIcon className="h-5 w-5 mr-2" />
            View Reports
          </button>
        </div>
      </div>
    </div>
  )
}

export default TeacherBatchAttendanceDetails
