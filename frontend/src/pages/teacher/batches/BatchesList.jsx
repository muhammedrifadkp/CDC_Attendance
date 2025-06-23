import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { batchesAPI, teachersAPI } from '../../../services/api'
import { PlusIcon, PencilIcon, TrashIcon, UserGroupIcon, ClipboardDocumentCheckIcon, ClockIcon, CheckCircleIcon, ArrowPathIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useAuth } from '../../../context/AuthContext'
import { showConfirm } from '../../../utils/popup'
import ExcelJS from 'exceljs'
import { format } from 'date-fns'

const BatchesList = () => {
  console.log('BatchesList component is rendering...')

  const { user } = useAuth()
  const location = useLocation()
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Determine if we're in admin context
  const isAdminContext = location.pathname.startsWith('/admin')
  const baseUrl = isAdminContext ? '/admin/batches' : '/batches'

  // Helper function to format timing display
  const formatTiming = (timing) => {
    if (!timing) return 'No timing set'

    const timeSlots = {
      '09:00-10:30': '09:00 AM - 10:30 AM',
      '10:30-12:00': '10:30 AM - 12:00 PM',
      '12:00-13:30': '12:00 PM - 01:30 PM',
      '14:00-15:30': '02:00 PM - 03:30 PM',
      '15:30-17:00': '03:30 PM - 05:00 PM'
    }

    return timeSlots[timing] || timing
  }

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        console.log('BatchesList: Starting to fetch batches...')
        setLoading(true)
        const res = await batchesAPI.getBatches()
        console.log('BatchesList: Batches fetched successfully:', res.data)
        setBatches(res.data)
      } catch (error) {
        console.error('BatchesList: Error fetching batches:', error)
        console.error('BatchesList: Error response:', error.response?.data)
        toast.error('Failed to fetch batches. Please check your connection.')
      } finally {
        setLoading(false)
      }
    }

    fetchBatches()
  }, [refreshKey])

  const handleDelete = async (id) => {
    const confirmed = await showConfirm('Are you sure you want to delete this batch? This will also delete all students and attendance records associated with this batch.', 'Delete Batch')
    if (confirmed) {
      try {
        await batchesAPI.deleteBatch(id)
        toast.success('Batch deleted successfully')
        setRefreshKey(prev => prev + 1)
      } catch (error) {
        toast.error('Failed to delete batch')
      }
    }
  }

  const handleToggleFinished = async (id, currentStatus) => {
    const action = currentStatus ? 'mark as active' : 'mark as finished'
    const confirmed = await showConfirm(`Are you sure you want to ${action} this batch?`, 'Toggle Batch Status')
    if (confirmed) {
      try {
        const res = await batchesAPI.toggleBatchFinished(id)
        toast.success(res.data.message)
        setRefreshKey(prev => prev + 1)
      } catch (error) {
        toast.error('Failed to update batch status')
      }
    }
  }

  // Excel Export Function for Teacher's Own Attendance
  const exportAttendanceToExcel = async () => {
    try {
      setDownloadLoading(true)

      // Fetch attendance data from API using the teacher's own ID
      const response = await teachersAPI.getTeacherAttendanceExport(user._id, {
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
      const fileName = `My_Attendance_${data.monthName}_${data.year}.xlsx`

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

  // Separate batches into active and finished
  const activeBatches = batches.filter(batch => !batch.isFinished)
  const finishedBatches = batches.filter(batch => batch.isFinished)

  // Function to render batch card
  const renderBatchCard = (batch, isFinished = false) => (
    <div
      key={batch._id}
      className={`bg-white overflow-hidden shadow-lg rounded-2xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group ${isFinished ? 'opacity-75' : ''}`}
    >
      {/* Clickable Header Section */}
      <Link to={`${baseUrl}/${batch._id}`} className="block">
        <div className={`px-6 py-6 bg-gradient-to-br transition-all duration-300 ${isFinished
          ? 'from-gray-100/50 to-gray-200/50 hover:from-gray-200/60 hover:to-gray-300/60'
          : 'from-cadd-purple/5 to-cadd-pink/5 hover:from-cadd-purple/10 hover:to-cadd-pink/10'
          }`}>
          <div className="flex items-center">
            <div className={`flex-shrink-0 rounded-xl p-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300 ${isFinished
              ? 'bg-gradient-to-br from-gray-400 to-gray-500'
              : 'bg-gradient-to-br from-cadd-red to-cadd-pink'
              }`}>
              <span className="text-white font-bold text-lg">
                {batch.name.substring(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="ml-5 w-0 flex-1">
              <div className="flex items-center">
                <h3 className={`text-xl font-bold truncate group-hover:text-cadd-red transition-colors duration-300 ${isFinished ? 'text-gray-600' : 'text-gray-900'
                  }`}>
                  {batch.name}
                </h3>
                {isFinished && (
                  <CheckCircleIcon className="h-5 w-5 text-green-500 ml-2 flex-shrink-0" />
                )}
              </div>
              <div className={`mt-2 flex items-center text-sm ${isFinished ? 'text-gray-500' : 'text-gray-600'}`}>
                <span className="font-medium">{batch.academicYear} • {batch.section}</span>
                {batch.isArchived && (
                  <span className="ml-2 px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    Archived
                  </span>
                )}
                {isFinished && (
                  <span className="ml-2 px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full bg-green-100 text-green-800">
                    Finished
                  </span>
                )}
              </div>
              {/* Course Information */}
              {batch.course && (
                <div className={`mt-2 flex items-center text-sm ${isFinished ? 'text-gray-500' : 'text-gray-600'}`}>
                  <span className="font-medium text-blue-600">
                    {batch.course.name} ({batch.course.code})
                  </span>
                  {batch.course.department && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {batch.course.department.name}
                    </span>
                  )}
                </div>
              )}
              {/* Batch Timing */}
              <div className={`mt-2 flex items-center text-sm ${isFinished ? 'text-gray-500' : 'text-gray-600'}`}>
                <ClockIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                <span className={`font-medium ${isFinished ? 'text-gray-500' : 'text-cadd-red'}`}>
                  {formatTiming(batch.timing)}
                </span>
              </div>
              {batch.createdBy && (
                <div className="mt-2 text-xs text-gray-500">
                  Created by: {' '}
                  {user && batch.createdBy._id === user._id ? (
                    <span className="text-cadd-red font-semibold">You</span>
                  ) : (
                    <span className="text-gray-700 font-medium">
                      {batch.createdBy.name}
                      {user && user.role === 'admin' && (
                        <span className="ml-1 px-2 py-0.5 bg-gradient-to-r from-green-100 to-green-200 text-green-800 rounded-full text-xs font-semibold">
                          {batch.createdBy.role === 'admin' ? 'Admin' : 'Teacher'}
                        </span>
                      )}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Click to view indicator */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-gray-500 font-medium">
              Click to view details
            </div>
            <div className="flex items-center text-cadd-red opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-xs font-medium mr-1">View Details</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </Link>

      {/* Action Buttons */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <div className="flex flex-wrap gap-2">
          <Link
            to={`${baseUrl}/${batch._id}/students`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-100 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-all duration-300"
          >
            <UserGroupIcon className="h-4 w-4 mr-1.5" />
            Students
          </Link>
          <Link
            to={`${baseUrl}/${batch._id}/attendance`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-100 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-all duration-300"
          >
            <ClipboardDocumentCheckIcon className="h-4 w-4 mr-1.5" />
            Attendance
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleToggleFinished(batch._id, batch.isFinished)
            }}
            className={`inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-xs font-semibold rounded-lg text-white transition-all duration-300 ${isFinished
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
              : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
              }`}
          >
            {isFinished ? (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-1.5" />
                Mark Active
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4 mr-1.5" />
                Mark Finished
              </>
            )}
          </button>
          <Link
            to={`${baseUrl}/${batch._id}/edit`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-100 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-all duration-300"
          >
            <PencilIcon className="h-4 w-4 mr-1.5" />
            Edit
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDelete(batch._id)
            }}
            className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-xs font-semibold rounded-lg text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-300"
          >
            <TrashIcon className="h-4 w-4 mr-1.5" />
            Delete
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div>
  {/* Header Section - Stacked on mobile */}
  <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
    <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Batches</h1>
    <div className="flex flex-col xs:flex-row gap-2 sm:gap-3">
      <button
        onClick={() => setShowDatePicker(true)}
        disabled={downloadLoading}
        className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
      >
        {downloadLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
        ) : (
          <ArrowDownTrayIcon className="mr-1 sm:mr-2 h-4 sm:h-5 w-4 sm:w-5" aria-hidden="true" />
        )}
        Download Attendance
      </button>
      <Link
        to={`${baseUrl}/new`}
        className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        <PlusIcon className="mr-1 sm:mr-2 h-4 sm:h-5 w-4 sm:w-5" aria-hidden="true" />
        New Batch
      </Link>
    </div>
  </div>

  {/* Loading/Empty States */}
  {loading ? (
    <div className="flex justify-center py-8">
      <div className="animate-spin rounded-full h-10 sm:h-12 w-10 sm:w-12 border-t-2 border-b-2 border-primary-600"></div>
    </div>
  ) : batches.length === 0 ? (
    <div className="bg-white shadow rounded-lg p-4 sm:p-6 text-center">
      <h3 className="text-sm sm:text-base font-medium text-gray-900">No batches found</h3>
      <p className="mt-1 text-xs sm:text-sm text-gray-500">
        Get started by creating a new batch.
      </p>
      <div className="mt-4 sm:mt-6">
        <Link
          to={`${baseUrl}/new`}
          className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent shadow-sm text-xs sm:text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="mr-1 sm:mr-2 h-4 sm:h-5 w-4 sm:w-5" aria-hidden="true" />
          New Batch
        </Link>
      </div>
    </div>
  ) : (
    <div className="space-y-6 sm:space-y-8">
      {/* Active Batches Section */}
      {activeBatches.length > 0 && (
        <div>
          <div className="flex items-center mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Active Batches</h2>
            <span className="ml-2 sm:ml-3 px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-green-100 to-green-200 text-green-800 rounded-full text-xs sm:text-sm font-semibold">
              {activeBatches.length}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {activeBatches.map((batch) => renderBatchCard(batch, false))}
          </div>
        </div>
      )}

      {/* Finished Batches Section */}
      {finishedBatches.length > 0 && (
        <div>
          <div className="flex items-center mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-600">Finished Batches</h2>
            <span className="ml-2 sm:ml-3 px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 rounded-full text-xs sm:text-sm font-semibold">
              {finishedBatches.length}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {finishedBatches.map((batch) => renderBatchCard(batch, true))}
          </div>
        </div>
      )}
    </div>
  )}

  {/* Date Picker Modal - Responsive */}
  {showDatePicker && (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start sm:items-center justify-center p-4">
      <div className="relative w-full max-w-sm sm:w-96 bg-white rounded-lg shadow-xl p-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Select Month & Year</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cadd-red text-sm sm:text-base"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2024, i, 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cadd-red text-sm sm:text-base"
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

        <div className="flex flex-col sm:flex-row items-center justify-end gap-2 sm:space-x-3 mt-6">
          <button
            onClick={() => setShowDatePicker(false)}
            className="w-full sm:w-auto px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={exportAttendanceToExcel}
            disabled={downloadLoading}
            className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-cadd-red to-cadd-pink text-white rounded-md hover:from-cadd-pink hover:to-cadd-red transition-all duration-300 disabled:opacity-50 text-sm sm:text-base"
          >
            {downloadLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Downloading...
              </div>
            ) : (
              'Download Excel'
            )}
          </button>
        </div>
      </div>
    </div>
  )}
</div>
  )
}

export default BatchesList
