import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { 
  attendanceAPI, 
  batchesAPI, 
  departmentsAPI, 
  studentsAPI 
} from '../../../services/api'
import {
  ClipboardDocumentCheckIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  CursorArrowRaysIcon
} from '@heroicons/react/24/outline'
import { formatDateSimple } from '../../../utils/dateUtils'
import BackButton from '../../../components/BackButton'

const AdminAttendanceDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // Data states
  const [todaySummary, setTodaySummary] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    attendanceRate: 0,
    batchesWithAttendance: 0,
    totalBatches: 0
  })
  const [batches, setBatches] = useState([])
  const [departments, setDepartments] = useState([])
  const [batchAttendanceData, setBatchAttendanceData] = useState([])
  const [filteredBatches, setFilteredBatches] = useState([])

  // Auto-fetch data when component mounts or date changes
  useEffect(() => {
    fetchData()
  }, [refreshKey, selectedDate])

  // Filter batches when data or filters change
  useEffect(() => {
    filterBatches()
  }, [batchAttendanceData, searchTerm, departmentFilter, statusFilter])

  // Auto-refresh on first load
  useEffect(() => {
    console.log('🔄 Admin Attendance Dashboard loaded - Auto-refreshing data...')
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Use Promise.allSettled to handle partial failures
      const [summaryRes, batchesRes, departmentsRes] = await Promise.allSettled([
        attendanceAPI.getAdminTodayAttendanceSummary(),
        batchesAPI.getBatches(),
        departmentsAPI.getDepartments()
      ])

      // Handle summary data
      if (summaryRes.status === 'fulfilled' && summaryRes.value?.data) {
        setTodaySummary(summaryRes.value.data)
      } else {
        console.warn('Failed to fetch attendance summary:', summaryRes.reason)
        // Set default values if API fails
        setTodaySummary({
          totalStudents: 0,
          presentToday: 0,
          absentToday: 0,
          lateToday: 0,
          attendanceRate: 0,
          batchesWithAttendance: 0,
          totalBatches: 0
        })
      }

      // Handle batches data
      let batchesData = []
      if (batchesRes.status === 'fulfilled' && batchesRes.value?.data) {
        batchesData = Array.isArray(batchesRes.value.data) ? batchesRes.value.data : []
      } else {
        console.warn('Failed to fetch batches:', batchesRes.reason)
        toast.error('Failed to load batches data')
      }

      // Handle departments data
      let departmentsData = []
      if (departmentsRes.status === 'fulfilled' && departmentsRes.value?.data) {
        departmentsData = Array.isArray(departmentsRes.value.data) ? departmentsRes.value.data : []
      } else {
        console.warn('Failed to fetch departments:', departmentsRes.reason)
      }

      setBatches(batchesData)
      setDepartments(departmentsData)

      // Fetch attendance data for each batch
      if (batchesData.length > 0) {
        await fetchBatchAttendanceData(batchesData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load attendance data')
    } finally {
      setLoading(false)
    }
  }

  const fetchBatchAttendanceData = async (batchesData) => {
    try {
      const dateToFetch = selectedDate
      console.log('Fetching attendance data for date:', dateToFetch)

      const attendancePromises = batchesData.map(async (batch) => {
        try {
          // Fetch attendance data (which includes all students in the batch)
          const attendanceRes = await attendanceAPI.getBatchAttendance(batch._id, dateToFetch)

          // Handle attendance data
          let attendanceData = []
          if (attendanceRes?.data) {
            attendanceData = Array.isArray(attendanceRes.data) ? attendanceRes.data : []
          } else {
            console.warn(`Failed to fetch attendance for batch ${batch._id}:`, attendanceRes)
          }

          // The API returns an array of student objects with attendance data
          // Each object has: { student: {...}, attendance: {...} }
          const presentCount = attendanceData.filter(record =>
            record.attendance && record.attendance.status === 'present'
          ).length
          const absentCount = attendanceData.filter(record =>
            record.attendance && record.attendance.status === 'absent'
          ).length
          const lateCount = attendanceData.filter(record =>
            record.attendance && record.attendance.status === 'late'
          ).length

          // Total students from the API response (includes all students in batch)
          const totalStudents = attendanceData.length

          // Calculate attendance rate based on marked attendance vs total students
          let attendanceRate = 0
          const markedAttendanceCount = attendanceData.filter(record => record.attendance).length
          if (totalStudents > 0 && markedAttendanceCount > 0) {
            attendanceRate = Math.round(((presentCount + lateCount) / totalStudents) * 100)
          }

          console.log(`Batch ${batch.name}: ${presentCount} present, ${absentCount} absent, ${lateCount} late, ${totalStudents} total`)

          return {
            ...batch,
            attendanceMarked: attendanceData.length > 0,
            presentCount,
            absentCount,
            lateCount,
            totalStudents,
            attendanceRate,
            lastUpdated: attendanceData.length > 0 ? selectedDate : null,
            selectedDate: selectedDate // Add selected date for reference
          }
        } catch (error) {
          console.error(`Error fetching attendance for batch ${batch._id}:`, error)

          return {
            ...batch,
            attendanceMarked: false,
            presentCount: 0,
            absentCount: 0,
            lateCount: 0,
            totalStudents: 0,
            attendanceRate: 0,
            lastUpdated: null,
            selectedDate: selectedDate // Add selected date for reference
          }
        }
      })

      const batchAttendanceResults = await Promise.allSettled(attendancePromises)
      const successfulResults = batchAttendanceResults
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value)

      console.log('Batch attendance data fetched:', successfulResults.length, 'batches')
      setBatchAttendanceData(successfulResults)
    } catch (error) {
      console.error('Error fetching batch attendance data:', error)
      toast.error('Failed to load batch attendance data')
    }
  }

  const filterBatches = () => {
    let filtered = [...batchAttendanceData]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(batch =>
        batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.course?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.section.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(batch =>
        batch.course?.department?._id === departmentFilter
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(batch => {
        if (statusFilter === 'marked') return batch.attendanceMarked
        if (statusFilter === 'pending') return !batch.attendanceMarked
        if (statusFilter === 'high') return batch.attendanceRate >= 80
        if (statusFilter === 'low') return batch.attendanceRate < 60
        return true
      })
    }

    setFilteredBatches(filtered)
  }

  const getAttendanceStatusColor = (rate) => {
    if (rate >= 80) return 'text-green-600 bg-green-100'
    if (rate >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getAttendanceStatusIcon = (rate) => {
    if (rate >= 80) return <CheckCircleIcon className="h-4 w-4" />
    if (rate >= 60) return <ClockIcon className="h-4 w-4" />
    return <XCircleIcon className="h-4 w-4" />
  }

  // Handle date change with user feedback
  const handleDateChange = (newDate) => {
    console.log('📅 Date changed to:', newDate)
    setSelectedDate(newDate)
    toast.info(`Loading attendance data for ${formatDateSimple(newDate)}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6">
  <div className="max-w-7xl mx-auto px-3 sm:px-4 sm:px-6 lg:px-8">
    {/* Back Button - Mobile Only */}
    <div className="mb-4 sm:mb-6 block sm:hidden">
      <BackButton />
    </div>

    {/* Header - Mobile Optimized */}
    <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl overflow-hidden relative mb-6 sm:mb-8">
      <div className="absolute inset-0 bg-gradient-to-r from-cadd-red/10 to-cadd-pink/10 pointer-events-none"></div>
      <div className="relative px-4 py-6 sm:px-8 sm:py-12 z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-1 sm:mb-2">Attendance Management</h1>
            <p className="text-gray-300 text-sm sm:text-lg">Monitor and manage attendance</p>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              Viewing: {formatDateSimple(selectedDate)}
              {selectedDate === new Date().toISOString().split('T')[0] && ' (Today)'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="text-center sm:text-right">
              <div className="text-2xl sm:text-3xl font-bold text-white">{todaySummary.attendanceRate}%</div>
              <div className="text-gray-300 text-xs sm:text-sm">
                {selectedDate === new Date().toISOString().split('T')[0] ? "Today's Rate" : "Selected Date Rate"}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <Link
                to="/admin/attendance/reports"
                className="inline-flex items-center justify-center px-4 py-2 sm:px-6 sm:py-3 border border-transparent rounded-lg sm:rounded-xl shadow-sm text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-300 transform hover:scale-105"
              >
                <ChartBarIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                Analytics
              </Link>
              <Link
                to="/admin/attendance/mark"
                className="inline-flex items-center justify-center px-4 py-2 sm:px-6 sm:py-3 border border-transparent rounded-lg sm:rounded-xl shadow-sm text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-cadd-red to-cadd-pink hover:from-cadd-red/90 hover:to-cadd-pink/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-all duration-300 transform hover:scale-105"
              >
                <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                Mark Attendance
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Statistics Cards - 2 columns on mobile */}
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
      <div className="bg-white rounded-lg sm:rounded-2xl shadow sm:shadow-lg p-3 sm:p-6">
        <div className="flex items-center">
          <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
            <UserGroupIcon className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
          </div>
          <div className="ml-3 sm:ml-4">
            <p className="text-xs sm:text-sm text-gray-500">Total Students</p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">{todaySummary.totalStudents}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg sm:rounded-2xl shadow sm:shadow-lg p-3 sm:p-6">
        <div className="flex items-center">
          <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
            <CheckCircleIcon className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
          </div>
          <div className="ml-3 sm:ml-4">
            <p className="text-xs sm:text-sm text-gray-500">
              {selectedDate === new Date().toISOString().split('T')[0] ? 'Present' : 'Present'}
            </p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">{todaySummary.presentToday}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg sm:rounded-2xl shadow sm:shadow-lg p-3 sm:p-6">
        <div className="flex items-center">
          <div className="p-2 sm:p-3 bg-red-100 rounded-lg">
            <XCircleIcon className="h-4 w-4 sm:h-6 sm:w-6 text-red-600" />
          </div>
          <div className="ml-3 sm:ml-4">
            <p className="text-xs sm:text-sm text-gray-500">
              {selectedDate === new Date().toISOString().split('T')[0] ? 'Absent' : 'Absent'}
            </p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">{todaySummary.absentToday}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg sm:rounded-2xl shadow sm:shadow-lg p-3 sm:p-6">
        <div className="flex items-center">
          <div className="p-2 sm:p-3 bg-yellow-100 rounded-lg">
            <ClockIcon className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-600" />
          </div>
          <div className="ml-3 sm:ml-4">
            <p className="text-xs sm:text-sm text-gray-500">
              {selectedDate === new Date().toISOString().split('T')[0] ? 'Late' : 'Late'}
            </p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">{todaySummary.lateToday}</p>
          </div>
        </div>
      </div>
    </div>

    {/* Search and Filter Controls - Stacked on mobile */}
    <div className="bg-white rounded-lg sm:rounded-2xl shadow sm:shadow-lg p-4 sm:p-6 border border-gray-100 mb-6 sm:mb-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Search */}
        <div className="sm:col-span-2 lg:col-span-1">
          <label htmlFor="search" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
            Search Batches
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-8 sm:pl-10 pr-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cadd-red focus:border-transparent transition-colors text-sm sm:text-base"
              placeholder="Search batches..."
            />
          </div>
        </div>

        {/* Date Selection */}
        <div>
          <label htmlFor="date" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
            Select Date
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
              <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="block w-full pl-8 sm:pl-10 pr-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cadd-red focus:border-transparent transition-colors text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Department Filter */}
        <div>
          <label htmlFor="department" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
            Department
          </label>
          <select
            id="department"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="block w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cadd-red focus:border-transparent transition-colors text-sm sm:text-base"
          >
            <option value="all">All</option>
            {departments && departments.map(dept => (
              <option key={dept._id} value={dept._id}>{dept.name}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label htmlFor="status" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
            Status
          </label>
          <select
            id="status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cadd-red focus:border-transparent transition-colors text-sm sm:text-base"
          >
            <option value="all">All</option>
            <option value="marked">Marked</option>
            <option value="pending">Pending</option>
            <option value="high">High (≥80%)</option>
            <option value="low">Low (&lt;60%)</option>
          </select>
        </div>

        {/* Quick Actions */}
        <div className="sm:col-span-2 lg:col-span-1">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
            Quick Actions
          </label>
          <div className="flex space-x-2">
            <Link
              to="/admin/attendance/reports"
              className="inline-flex items-center justify-center px-2 sm:px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
            >
              <ChartBarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Analytics
            </Link>
            <button
              onClick={() => setRefreshKey(prev => prev + 1)}
              className="inline-flex items-center justify-center px-2 sm:px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-colors"
              title="Refresh"
            >
              <CursorArrowRaysIcon className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="mt-3 sm:mt-4 flex items-center justify-between text-xs sm:text-sm text-gray-600">
        <span>
          Showing {filteredBatches.length} of {batchAttendanceData.length} batch{batchAttendanceData.length !== 1 ? 'es' : ''}
        </span>
        {(searchTerm || departmentFilter !== 'all' || statusFilter !== 'all') && (
          <button
            onClick={() => {
              setSearchTerm('')
              setDepartmentFilter('all')
              setStatusFilter('all')
            }}
            className="text-cadd-red hover:text-cadd-pink font-medium text-xs sm:text-sm"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>

    {/* Batch Attendance Grid - Single column on mobile */}
    {loading ? (
      <div className="flex justify-center items-center py-8 sm:py-12">
        <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-cadd-red"></div>
      </div>
    ) : filteredBatches.length === 0 ? (
      <div className="bg-white rounded-lg sm:rounded-2xl shadow sm:shadow-lg p-6 sm:p-12 text-center">
        <ClipboardDocumentCheckIcon className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No batches found</h3>
        <p className="mt-1 text-xs sm:text-sm text-gray-500">
          {batchAttendanceData.length === 0
            ? "No batches available."
            : "Try adjusting your search or filters."}
        </p>
      </div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredBatches.map((batch) => (
          <div key={batch._id} className="bg-white rounded-lg sm:rounded-2xl shadow sm:shadow-lg overflow-hidden hover:shadow-md sm:hover:shadow-xl transition-all duration-300 transform hover:scale-[1.01] sm:hover:scale-105 border border-gray-100">
            {/* Batch Header */}
            <div className="bg-gradient-to-r from-cadd-red to-cadd-pink px-4 py-3 sm:px-6 sm:py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-bold text-white truncate">{batch.name}</h3>
                <span className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-xs font-medium ${
                  batch.attendanceMarked
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {batch.attendanceMarked ? 'Marked' : 'Pending'}
                </span>
              </div>
              <p className="text-white/80 text-xs sm:text-sm mt-1">
                {batch.course?.name} • {batch.section}
              </p>
            </div>

            {/* Batch Information */}
            <div className="px-4 py-3 sm:px-6 sm:py-4">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center text-xs sm:text-sm text-gray-600">
                  <BuildingOfficeIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-gray-400" />
                  <span className="truncate">{batch.course?.department?.name || 'N/A'}</span>
                </div>
                <div className="flex items-center text-xs sm:text-sm text-gray-600">
                  <UserGroupIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-gray-400" />
                  <span>{batch.totalStudents} Students</span>
                </div>
                <div className="flex items-center text-xs sm:text-sm text-gray-600">
                  <CalendarDaysIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-gray-400" />
                  <span>{batch.timing || 'No timing set'}</span>
                </div>

                {/* Attendance Stats */}
                <div className="bg-gray-50 rounded-lg p-2 sm:p-3 mt-3 sm:mt-4">
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <span className="text-xs sm:text-sm font-medium text-gray-700">
                      {selectedDate === new Date().toISOString().split('T')[0] ? "Today" : "Selected Date"}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium ${getAttendanceStatusColor(batch.attendanceRate)}`}>
                      {getAttendanceStatusIcon(batch.attendanceRate)}
                      <span className="ml-1">{batch.attendanceRate}%</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 sm:gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-semibold text-green-600">{batch.presentCount}</div>
                      <div className="text-gray-500">Present</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-red-600">{batch.absentCount}</div>
                      <div className="text-gray-500">Absent</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-yellow-600">{batch.lateCount}</div>
                      <div className="text-gray-500">Late</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-4 py-3 sm:px-6 sm:py-4 bg-gray-50 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex space-x-1 sm:space-x-2">
                  <Link
                    to={`/admin/attendance/batch/${batch._id}`}
                    className="inline-flex items-center p-1 sm:p-2 border border-transparent rounded-lg text-xs sm:text-sm font-medium text-gray-600 bg-white hover:bg-gray-100 hover:text-cadd-red focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-colors"
                    title="View Details"
                  >
                    <EyeIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Link>
                  <Link
                    to={`/admin/attendance/mark/${batch._id}`}
                    className="inline-flex items-center p-1 sm:p-2 border border-transparent rounded-lg text-xs sm:text-sm font-medium text-gray-600 bg-white hover:bg-gray-100 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    title="Mark Attendance"
                  >
                    <ClipboardDocumentCheckIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Link>
                  <Link
                    to="/admin/attendance/reports"
                    className="inline-flex items-center p-1 sm:p-2 border border-transparent rounded-lg text-xs sm:text-sm font-medium text-gray-600 bg-white hover:bg-gray-100 hover:text-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                    title="Analytics"
                  >
                    <ChartBarIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Link>
                </div>
                <div className="text-xs text-gray-500">
                  {batch.attendanceMarked ? formatDateSimple(batch.selectedDate || selectedDate) : 'Not marked'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
</div>
  )
}

export default AdminAttendanceDashboard
