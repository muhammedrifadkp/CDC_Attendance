import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { teachersAPI, batchesAPI } from '../../../services/api'
import ExcelJS from 'exceljs'
import { format } from 'date-fns'
import {
  UserIcon,
  ArrowLeftIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  PencilIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
  StarIcon,
  BriefcaseIcon,
  TrashIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../../../context/AuthContext'
import { showConfirm } from '../../../utils/popup'
import { formatDateLong, formatDateSimple } from '../../../utils/dateUtils'
import BackButton from '../../../components/BackButton'

const TeacherDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [teacher, setTeacher] = useState(null)
  const [stats, setStats] = useState(null)
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        setLoading(true)

        // Fetch teacher details and statistics in parallel
        const [teacherRes, statsRes, batchesRes] = await Promise.all([
          teachersAPI.getTeacher(id),
          teachersAPI.getTeacherStats(id),
          batchesAPI.getBatches()
        ])

        setTeacher(teacherRes.data)
        setStats(statsRes.data.stats)

        // Filter batches by this teacher
        const teacherBatches = batchesRes.data.filter(batch =>
          batch.createdBy && batch.createdBy._id === id
        )
        setBatches(teacherBatches)

      } catch (error) {
        console.error('Error fetching teacher data:', error)
        toast.error('Failed to fetch teacher details')
        navigate('/admin/teachers')
      } finally {
        setLoading(false)
      }
    }

    fetchTeacherData()
  }, [id, navigate])



  const handleDelete = async () => {
    try {
      setActionLoading(true)
      await teachersAPI.deleteTeacher(id)
      toast.success('Teacher deleted successfully')
      navigate('/admin/teachers')
    } catch (error) {
      console.error('Error deleting teacher:', error)
      toast.error(error.response?.data?.message || 'Failed to delete teacher')
    } finally {
      setActionLoading(false)
      setShowDeleteModal(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-cadd-red border-t-transparent absolute top-0 left-0"></div>
        </div>
      </div>
    )
  }

  if (!teacher) {
    return (
      <div className="bg-white shadow-lg rounded-2xl p-8 text-center">
        <h3 className="text-lg font-medium text-gray-900">Teacher not found</h3>
        <p className="mt-2 text-sm text-gray-500">The teacher you're looking for doesn't exist.</p>
        <Link
          to="/admin/teachers"
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-cadd-red to-cadd-pink hover:from-cadd-pink hover:to-cadd-red transition-all duration-300"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Teachers
        </Link>
      </div>
    )
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white'
      default:
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
    }
  }

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrator'
      default:
        return 'Teacher'
    }
  }

  // Excel Export Function
  const exportAttendanceToExcel = async () => {
    try {
      setDownloadLoading(true)

      // Fetch attendance data from API
      const response = await teachersAPI.getTeacherAttendanceExport(id, {
        month: selectedMonth,
        year: selectedYear
      })

      const data = response.data

      if (!data.batches || data.batches.length === 0) {
        toast.error('No attendance data found for the selected month')
        return
      }

      // Create a new workbook
      const workbook = new ExcelJS.Workbook()

      // Process each batch as a separate sheet
      data.batches.forEach((batchData, index) => {
        const sheetName = `${batchData.batch.name.substring(0, 25)}` // Limit sheet name length
        const worksheet = workbook.addWorksheet(sheetName)

        // Set up the header
        worksheet.mergeCells('A1:F1')
        worksheet.getCell('A1').value = 'Monthly Class Attendance'
        worksheet.getCell('A1').font = { bold: true, size: 16 }
        worksheet.getCell('A1').alignment = { horizontal: 'center' }

        worksheet.mergeCells('G1:L1')
        worksheet.getCell('G1').value = 'CDC'
        worksheet.getCell('G1').font = { bold: true, size: 16 }
        worksheet.getCell('G1').alignment = { horizontal: 'center' }

        // Teacher and course info
        worksheet.getCell('A3').value = 'Teacher'
        worksheet.getCell('B3').value = data.teacher.name
        worksheet.getCell('G3').value = 'Course'
        worksheet.getCell('H3').value = batchData.batch.course
        worksheet.getCell('K3').value = 'Month'
        worksheet.getCell('L3').value = data.monthName

        worksheet.getCell('A4').value = 'Room'
        worksheet.getCell('B4').value = batchData.batch.section
        worksheet.getCell('G4').value = 'Period/Time'
        worksheet.getCell('H4').value = batchData.batch.timing
        worksheet.getCell('K4').value = 'Year'
        worksheet.getCell('L4').value = data.year

        // Attendance legend
        worksheet.getCell('A6').value = 'Enter: P = Present, A = Absent, L = Late'
        worksheet.getCell('A6').font = { italic: true, size: 10 }

        // Create header row for dates
        const headerRow = worksheet.getRow(8)
        headerRow.getCell(1).value = 'ID'
        headerRow.getCell(2).value = 'Student Name'

        // Add day headers
        batchData.days.forEach((day, dayIndex) => {
          const cell = headerRow.getCell(3 + dayIndex)
          cell.value = day.dayName
          cell.alignment = { horizontal: 'center' }
        })

        // Add date row
        const dateRow = worksheet.getRow(9)
        dateRow.getCell(1).value = ''
        dateRow.getCell(2).value = ''

        batchData.days.forEach((day, dayIndex) => {
          const cell = dateRow.getCell(3 + dayIndex)
          cell.value = day.day
          cell.alignment = { horizontal: 'center' }
        })

        // Add student data
        batchData.students.forEach((studentData, studentIndex) => {
          const row = worksheet.getRow(10 + studentIndex)
          row.getCell(1).value = studentIndex + 1
          row.getCell(2).value = studentData.student.name

          // Add attendance data
          studentData.attendance.forEach((attendance, dayIndex) => {
            const cell = row.getCell(3 + dayIndex)
            cell.value = attendance.displayStatus
            cell.alignment = { horizontal: 'center' }

            // Color coding
            if (attendance.displayStatus === 'P') {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E8' } }
            } else if (attendance.displayStatus === 'A') {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEAEA' } }
            } else if (attendance.displayStatus === 'L') {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF4E6' } }
            }
          })
        })

        // Style the worksheet
        worksheet.columns.forEach((column, index) => {
          if (index === 0) column.width = 5  // ID column
          else if (index === 1) column.width = 25 // Name column
          else column.width = 4 // Date columns
        })

        // Add borders to data area
        const dataRange = `A8:${String.fromCharCode(67 + batchData.days.length - 1)}${9 + batchData.students.length}`
        worksheet.getCell(dataRange).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      })

      // Generate filename
      const fileName = `${data.teacher.name.replace(/\s+/g, '_')}_Attendance_${data.monthName}_${data.year}.xlsx`

      // Save the file
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.click()
      window.URL.revokeObjectURL(url)

      toast.success('Attendance Excel sheet downloaded successfully!')
      setShowDatePicker(false)

    } catch (error) {
      console.error('Error exporting attendance to Excel:', error)
      toast.error('Failed to export attendance data')
    } finally {
      setDownloadLoading(false)
    }
  }

  return (
   <div className="space-y-6 md:space-y-8">
  {/* Enhanced Header - Stacked on mobile */}
  <div className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-xl md:rounded-2xl shadow-lg md:shadow-2xl">
    <div className="absolute inset-0 bg-gradient-to-r from-cadd-red/10 to-cadd-pink/10"></div>
    <div className="relative px-4 py-8 md:px-8 md:py-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-6">
          <Link
            to="/admin/teachers"
            className="inline-flex items-center px-3 py-1.5 md:px-4 md:py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg md:rounded-xl transition-all duration-300 backdrop-blur-sm text-sm md:text-base"
          >
            <ArrowLeftIcon className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
            Back to Teachers
          </Link>
          <div className="hidden sm:block w-px h-8 bg-white/30"></div>
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2">{teacher.name}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-white/90 text-sm md:text-base">
              <span className="flex items-center">
                <EnvelopeIcon className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
                {teacher.email}
              </span>
              <span className="hidden sm:inline">•</span>
              <span className={`px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-medium ${getRoleColor(teacher.role)}`}>
                {getRoleLabel(teacher.role)}
              </span>
              {!teacher.active && (
                <>
                  <span className="hidden sm:inline">•</span>
                  <span className="px-2 py-0.5 md:px-3 md:py-1 bg-red-500/20 text-red-200 rounded-full text-xs md:text-sm font-medium">
                    Inactive
                  </span>
                </>
              )}
            </div>
            <div className="mt-2 md:mt-3 text-xs md:text-sm text-white/80">
              <span className="flex items-center">
                <CalendarDaysIcon className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                Joined {formatDateLong(teacher.createdAt)}
              </span>
            </div>
          </div>
        </div>
        <div className="hidden lg:block">
          <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <span className="text-white font-bold text-xl md:text-2xl lg:text-3xl">
              {teacher.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Enhanced Stats Cards - Stacked on mobile */}
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {/* Batches Card */}
    <div className="bg-white overflow-hidden shadow-md md:shadow-xl rounded-xl md:rounded-2xl hover:shadow-lg md:hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] md:hover:scale-105 group">
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow group-hover:shadow-md md:group-hover:shadow-lg transition-shadow duration-300">
            <AcademicCapIcon className="h-6 w-6 md:h-8 md:w-8 text-white" />
          </div>
          <div className="text-right">
            <div className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">{stats?.batches?.total || 0}</div>
            <div className="text-xs md:text-sm font-medium text-gray-500">Total Batches</div>
          </div>
        </div>
        <div className="space-y-1 md:space-y-2">
          <div className="text-xs md:text-sm text-gray-600">
            Batches created and managed by this teacher
          </div>
          {stats?.batches && (
            <div className="flex items-center space-x-2 md:space-x-4 text-xs">
              <span className="text-green-600 font-medium">
                {stats.batches.active} Active
              </span>
              <span className="text-gray-500">
                {stats.batches.finished} Finished
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="bg-gradient-to-r from-green-50 to-green-100 px-4 py-3 md:px-6 md:py-4 border-t border-green-200">
        <div className="text-xs md:text-sm font-semibold text-green-700">
          {stats?.batches?.total > 0 ? 'View batches below' : 'No batches yet'}
        </div>
      </div>
    </div>

    {/* Students Card */}
    <div className="bg-white overflow-hidden shadow-md md:shadow-xl rounded-xl md:rounded-2xl hover:shadow-lg md:hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] md:hover:scale-105 group">
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow group-hover:shadow-md md:group-hover:shadow-lg transition-shadow duration-300">
            <UserGroupIcon className="h-6 w-6 md:h-8 md:w-8 text-white" />
          </div>
          <div className="text-right">
            <div className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">{stats?.students?.total || 0}</div>
            <div className="text-xs md:text-sm font-medium text-gray-500">Total Students</div>
          </div>
        </div>
        <div className="space-y-1 md:space-y-2">
          <div className="text-xs md:text-sm text-gray-600">
            Students across all batches managed by this teacher
          </div>
          {stats?.students && (
            <div className="flex items-center space-x-2 md:space-x-4 text-xs">
              <span className="text-blue-600 font-medium">
                {stats.students.active} Active
              </span>
              <span className="text-gray-500">
                Avg: {stats.students.averageBatchSize} per batch
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 md:px-6 md:py-4 border-t border-blue-200">
        <div className="text-xs md:text-sm font-semibold text-blue-700">
          {stats?.students?.total > 0 ? 'Distributed across batches' : 'No students yet'}
        </div>
      </div>
    </div>

    {/* Actions Card - Full width on mobile */}
    <div className="bg-white overflow-hidden shadow-md md:shadow-xl rounded-xl md:rounded-2xl hover:shadow-lg md:hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] md:hover:scale-105 group sm:col-span-2 lg:col-span-1">
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-gradient-to-br from-cadd-red to-cadd-pink shadow group-hover:shadow-md md:group-hover:shadow-lg transition-shadow duration-300">
            <UserIcon className="h-6 w-6 md:h-8 md:w-8 text-white" />
          </div>
          <div className="text-right">
            <div className="text-base md:text-lg font-bold text-gray-900">Actions</div>
            <div className="text-xs md:text-sm font-medium text-gray-500">Manage Teacher</div>
          </div>
        </div>
        <div className="space-y-2 md:space-y-3">
          <Link
            to={`/admin/teachers/${id}/edit`}
            className="w-full inline-flex items-center justify-center px-3 py-1.5 md:px-4 md:py-2 border border-transparent text-xs md:text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
          >
            <PencilIcon className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            Edit Teacher
          </Link>
          <button
            onClick={() => setShowDatePicker(true)}
            disabled={downloadLoading}
            className="w-full inline-flex items-center justify-center px-3 py-1.5 md:px-4 md:py-2 border border-transparent text-xs md:text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition-all duration-300 disabled:opacity-50"
          >
            {downloadLoading ? (
              <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-2 border-white border-t-transparent mr-1 md:mr-2"></div>
            ) : (
              <ArrowDownTrayIcon className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            )}
            Download Attendance
          </button>
        </div>
      </div>
    </div>
  </div>

  {/* Teacher's Batches - Stacked on mobile */}
  {batches.length > 0 && (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-md md:shadow-lg p-4 md:p-6">
      <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6">Batches Created by {teacher.name}</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {batches.map((batch) => (
          <Link
            key={batch._id}
            to={`/admin/batches/${batch._id}`}
            className="group bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg md:rounded-xl p-3 md:p-4 hover:shadow-md md:hover:shadow-lg hover:border-cadd-red/30 transition-all duration-300 transform hover:scale-[1.02] md:hover:scale-105"
          >
            <div className="flex items-center mb-2 md:mb-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-cadd-red to-cadd-pink rounded-md md:rounded-lg flex items-center justify-center mr-2 md:mr-3 group-hover:shadow-md transition-shadow duration-300">
                <span className="text-white font-bold text-xs md:text-sm">
                  {batch.name.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 group-hover:text-cadd-red transition-colors duration-300 text-sm md:text-base">
                  {batch.name}
                </h4>
                <p className="text-xs md:text-sm text-gray-500">
                  {batch.academicYear} • {batch.section}
                </p>
              </div>
            </div>
            {batch.isArchived && (
              <span className="inline-flex items-center px-1.5 py-0.5 md:px-2 md:py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Archived
              </span>
            )}
            <div className="mt-2 md:mt-3 flex items-center text-xs text-gray-500">
              <CalendarDaysIcon className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              Created {formatDateSimple(batch.createdAt)}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )}

  {/* Empty State for No Batches - Adjusted for mobile */}
  {batches.length === 0 && (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-md md:shadow-lg p-6 md:p-8 text-center">
      <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
        <AcademicCapIcon className="h-5 w-5 md:h-8 md:w-8 text-gray-400" />
      </div>
      <h3 className="text-base md:text-lg font-medium text-gray-900 mb-1 md:mb-2">No Batches Created</h3>
      <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
        {teacher.name} hasn't created any batches yet. Batches will appear here once they start creating them.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs md:text-sm text-gray-500">
        <div className="flex items-center">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-1 md:mr-2"></div>
          <span>Active Batches</span>
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 bg-yellow-400 rounded-full mr-1 md:mr-2"></div>
          <span>Archived Batches</span>
        </div>
      </div>
    </div>
  )}

  {/* Quick Actions - Stacked on mobile */}
  <div className="bg-white rounded-xl md:rounded-2xl shadow-md md:shadow-lg p-4 md:p-6">
    <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4 md:mb-6">Quick Actions</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <Link
        to={`/admin/teachers/${id}/edit`}
        className="inline-flex items-center justify-center px-4 py-2 md:px-6 md:py-3 border border-transparent text-xs md:text-sm font-semibold rounded-lg md:rounded-xl text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow hover:shadow-md md:hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] md:hover:scale-105"
      >
        <PencilIcon className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
        Edit Profile
      </Link>
      <Link
        to="/admin/batches"
        className="inline-flex items-center justify-center px-4 py-2 md:px-6 md:py-3 border border-transparent text-xs md:text-sm font-semibold rounded-lg md:rounded-xl text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow hover:shadow-md md:hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] md:hover:scale-105"
      >
        <AcademicCapIcon className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
        View All Batches
      </Link>
      <Link
        to="/admin/students"
        className="inline-flex items-center justify-center px-4 py-2 md:px-6 md:py-3 border border-transparent text-xs md:text-sm font-semibold rounded-lg md:rounded-xl text-white bg-gradient-to-r from-cadd-red to-cadd-pink hover:from-cadd-pink hover:to-cadd-red focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red shadow hover:shadow-md md:hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] md:hover:scale-105"
      >
        <UserGroupIcon className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
        View All Students
      </Link>
      <button
        onClick={() => setShowDatePicker(true)}
        disabled={downloadLoading}
        className="inline-flex items-center justify-center px-4 py-2 md:px-6 md:py-3 border border-transparent text-xs md:text-sm font-semibold rounded-lg md:rounded-xl text-white bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 shadow hover:shadow-md md:hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] md:hover:scale-105 disabled:opacity-50"
      >
        {downloadLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-2 border-white border-t-transparent mr-1 md:mr-2"></div>
        ) : (
          <ArrowDownTrayIcon className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
        )}
        Download Attendance
      </button>
    </div>
  </div>

  {/* Date Picker Modal - Responsive */}
  {showDatePicker && (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl max-w-xs sm:max-w-md w-full p-4 md:p-5">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-3 md:mb-4">Select Month & Year</h3>

          <div className="space-y-3 md:space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cadd-red text-sm md:text-base"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2024, i, 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cadd-red text-sm md:text-base"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - 2 + i
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  )
                })}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 md:space-x-3 mt-4 md:mt-6">
            <button
              onClick={() => setShowDatePicker(false)}
              className="px-3 py-1.5 md:px-4 md:py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors text-sm md:text-base"
            >
              Cancel
            </button>
            <button
              onClick={exportAttendanceToExcel}
              disabled={downloadLoading}
              className="px-3 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-cadd-red to-cadd-pink text-white rounded-md hover:from-cadd-pink hover:to-cadd-red transition-all duration-300 disabled:opacity-50 text-sm md:text-base"
            >
              {downloadLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-2 border-white border-t-transparent mr-1 md:mr-2"></div>
                  Downloading...
                </div>
              ) : (
                'Download Excel'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )}
</div>
  )
}

export default TeacherDetails