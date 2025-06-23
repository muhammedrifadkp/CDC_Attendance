import { useState, useEffect } from 'react'
import {
  ComputerDesktopIcon,
  ClockIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ChartBarIcon,
  PlayIcon,
  PauseIcon,
  StopIcon
} from '@heroicons/react/24/outline'
import { pcAPI, bookingAPI, labAPI } from '../../services/labAPI'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import {
  getCurrentTimeFormatted,
  getCurrentDateFormatted,
  getTimeSlotStatus
} from '../../utils/batchTimeUtils'
import { TIME_SLOTS, getCurrentTimeSlot as getCentralizedCurrentTimeSlot, getCurrentTimeSlotWithReason, getTimeSlotLabel } from '../../utils/timeSlots'

const LabAvailability = () => {
  const { user } = useAuth()
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('')
  const [pcsByRow, setPcsByRow] = useState({})
  const [filteredPCs, setFilteredPCs] = useState({})
  const [bookings, setBookings] = useState([])
  const [labInfo, setLabInfo] = useState(null)
  const [departments, setDepartments] = useState([])
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [labInfoLoading, setLabInfoLoading] = useState(true)
  const [showPCDetailsModal, setShowPCDetailsModal] = useState(false)
  const [selectedPC, setSelectedPC] = useState(null)
  const [currentTime, setCurrentTime] = useState(getCurrentTimeFormatted())
  const [currentDate, setCurrentDate] = useState(getCurrentDateFormatted())
  const [autoSelected, setAutoSelected] = useState(false)

  // Enhanced filtering states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [selectedBatch, setSelectedBatch] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'

  const timeSlots = TIME_SLOTS

  useEffect(() => {
    // Auto-select current time slot on first load
    if (!autoSelected) {
      const currentSlot = getCentralizedCurrentTimeSlot()
      if (currentSlot) {
        setSelectedTimeSlot(currentSlot.id)
        setAutoSelected(true)

        // Get detailed reason for selection
        const { reason, scenario } = getCurrentTimeSlotWithReason()

        // Show appropriate toast message based on scenario
        let toastMessage = `🕒 Auto-selected: ${currentSlot.label}`
        let toastIcon = '🕒'

        switch (scenario) {
          case 'active':
            toastIcon = '✅'
            toastMessage = `${toastIcon} Current time slot: ${currentSlot.label}`
            break
          case 'after-hours':
            toastIcon = '🌙'
            toastMessage = `${toastIcon} After hours - Selected: ${currentSlot.label}`
            break
          case 'before-hours':
            toastIcon = '🌅'
            toastMessage = `${toastIcon} Early morning - Selected: ${currentSlot.label}`
            break
          default:
            toastIcon = '🕒'
            toastMessage = `${toastIcon} Auto-selected: ${currentSlot.label}`
        }

        toast.success(toastMessage)
      } else {
        setSelectedTimeSlot('10:30 AM - 12:00 PM') // Default fallback
        setAutoSelected(true)
      }
    }

    fetchLabInfo()
    fetchData()

    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(getCurrentTimeFormatted())
    }, 1000)

    // Update date every minute
    const dateInterval = setInterval(() => {
      setCurrentDate(getCurrentDateFormatted())
    }, 60000)

    return () => {
      clearInterval(timeInterval)
      clearInterval(dateInterval)
    }
  }, [])

  // Auto-fetch PC data when time slot changes
  useEffect(() => {
    if (selectedTimeSlot && autoSelected) {
      fetchData()
    }
  }, [selectedTimeSlot])

  // Auto-refresh data every 30 seconds to stay in sync with admin changes
  useEffect(() => {
    if (selectedTimeSlot) {
      const interval = setInterval(() => {
        fetchData()
      }, 30000) // Refresh every 30 seconds

      return () => clearInterval(interval)
    }
  }, [selectedTimeSlot])

  // Filter PCs based on search and filters
  useEffect(() => {
    let filtered = { ...pcsByRow }

    // Apply department filter to bookings if needed
    if (selectedDepartment !== 'all' || selectedBatch !== 'all' || searchTerm) {
      // Filter based on current bookings and batch associations
      const relevantBookings = bookings.filter(booking => {
        if (selectedDepartment !== 'all' && booking.batch?.course?.department?._id !== selectedDepartment) {
          return false
        }
        if (selectedBatch !== 'all' && booking.batch?._id !== selectedBatch) {
          return false
        }
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase()
          return (
            booking.studentName?.toLowerCase().includes(searchLower) ||
            booking.teacherName?.toLowerCase().includes(searchLower) ||
            booking.purpose?.toLowerCase().includes(searchLower) ||
            booking.batch?.name?.toLowerCase().includes(searchLower)
          )
        }
        return true
      })

      // Update filtered PCs based on relevant bookings
      setFilteredPCs(filtered)
    } else {
      setFilteredPCs(filtered)
    }
  }, [pcsByRow, bookings, searchTerm, selectedDepartment, selectedBatch, selectedStatus])

  const fetchLabInfo = async () => {
    try {
      const response = await labAPI.info.getLabInfo()
      setLabInfo(response)
    } catch (error) {
      console.error('Error fetching lab info:', error)
    } finally {
      setLabInfoLoading(false)
    }
  }

  const fetchData = async (timeSlot = selectedTimeSlot) => {
    try {
      setLoading(true)
      const today = new Date().toISOString().split('T')[0]

      // Fetch data with time slot context for better filtering
      const [pcsRes, bookingsRes, departmentsRes, batchesRes] = await Promise.all([
        pcAPI.getPCsByRow(),
        bookingAPI.getBookingsWithAttendance({
          date: today,
          timeSlot: timeSlot // Include time slot for more targeted data
        }),
        api.get('/departments?active=true'),
        api.get('/batches?active=true')
      ])

      // Handle response format - check if data is nested
      const pcsData = pcsRes?.data || pcsRes || {}
      const bookingsData = bookingsRes?.data || bookingsRes || []



      setPcsByRow(pcsData)
      setBookings(Array.isArray(bookingsData) ? bookingsData : [])

      // Filter departments to only include the 4 required ones
      const allDepartments = departmentsRes.data || []
      const requiredDepartments = allDepartments.filter(dept =>
        ['CADD', 'LIVEWIRE', 'DREAMZONE', 'SYNERGY'].includes(dept.name)
      )
      setDepartments(requiredDepartments)

      // Set batches data
      setBatches(batchesRes.data?.batches || batchesRes.data || [])

      // Show success toast for manual time slot changes
      if (timeSlot !== selectedTimeSlot && autoSelected) {
        toast.success(`PC data updated for ${getTimeSlotLabel(timeSlot)}`)
      }

    } catch (error) {
      console.error('Error fetching lab data:', error)
      toast.error('Failed to fetch lab data: ' + (error.response?.data?.message || error.message))
      // Set default values on error
      setPcsByRow({})
      setBookings([])
      setDepartments([])
      setBatches([])
    } finally {
      setLoading(false)
    }
  }

  const getBookingForPCAndTime = (pcId, timeSlot) => {
    const booking = bookings.find(booking =>
      booking.pc &&
      booking.pc._id === pcId &&
      booking.timeSlot === timeSlot &&
      booking.status !== 'cancelled'  // Show all non-cancelled bookings as occupied
    )



    return booking
  }

  const getAvailableCount = (timeSlot) => {
    if (!filteredPCs || typeof filteredPCs !== 'object') return 0

    const allPCs = Object.values(filteredPCs).flat()
    return allPCs.filter(pc => {
      if (!pc || !pc._id) return false
      const booking = getBookingForPCAndTime(pc._id, timeSlot)
      return !booking && pc.status === 'active'
    }).length
  }

  const getTotalCount = () => {
    return Object.values(filteredPCs).flat().length
  }

  const hasPCs = () => {
    return Object.values(pcsByRow).flat().length > 0
  }

  const getTimeSlotLabel = (timeSlotId) => {
    const slot = timeSlots.find(s => s.id === timeSlotId)
    return slot ? slot.label : timeSlotId
  }

  const getFilteredBookings = () => {
    let filtered = bookings

    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(booking =>
        booking.batch?.course?.department?._id === selectedDepartment
      )
    }

    if (selectedBatch !== 'all') {
      filtered = filtered.filter(booking =>
        booking.batch?._id === selectedBatch
      )
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(booking =>
        booking.studentName?.toLowerCase().includes(searchLower) ||
        booking.studentId?.toLowerCase().includes(searchLower) ||
        booking.teacherName?.toLowerCase().includes(searchLower) ||
        booking.purpose?.toLowerCase().includes(searchLower) ||
        booking.batch?.name?.toLowerCase().includes(searchLower)
      )
    }

    return filtered
  }

  // Get PC availability for the selected time slot
  const getPCAvailability = (pcNumber, rowNumber) => {
    const pc = Object.values(filteredPCs).flat().find(p => {
      // Handle both row and rowNumber properties
      const pcRow = p.rowNumber || parseInt(p.row)
      const targetRow = parseInt(rowNumber)

      // Match by pcNumber and row (if both are available)
      if (pcRow && targetRow) {
        return p.pcNumber === pcNumber && pcRow === targetRow
      }
      // Fallback: match by pcNumber only
      return p.pcNumber === pcNumber
    })

    if (!pc) {
      return { status: 'unavailable', bookedFor: null, booking: null }
    }

    // Check for active booking (occupied)
    const activeBooking = getBookingForPCAndTime(pc._id, selectedTimeSlot)

    if (activeBooking) {
      // Determine status based on attendance
      let bookingStatus = 'occupied'
      if (activeBooking.attendanceStatus) {
        switch (activeBooking.attendanceStatus) {
          case 'present':
            bookingStatus = 'booked-present'
            break
          case 'absent':
            bookingStatus = 'booked-absent'
            break
          case 'late':
            bookingStatus = 'booked-late'
            break
          default:
            bookingStatus = 'booked-pending'
        }
      }

      return {
        status: bookingStatus,
        bookedFor: activeBooking.studentName,
        booking: activeBooking,
        attendanceStatus: activeBooking.attendanceStatus
      }
    }

    return {
      status: pc.status === 'active' ? 'available' : pc.status,
      bookedFor: null,
      booking: null
    }
  }

  // Get PCs organized by rows
  const getPCsByRows = () => {
    return filteredPCs
  }

  // Get PC status color - Enhanced Smart Color-Coded System
  const getPCStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-500 hover:bg-green-600 text-white shadow-green-200'
      case 'booked-present':
        return 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200'  // Orange for present students
      case 'booked-absent':
        return 'bg-red-500 hover:bg-red-600 text-white shadow-red-200'      // Red for absent students
      case 'booked-late':
        return 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-yellow-200' // Yellow for late students
      case 'booked-pending':
        return 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-200'    // Blue for pending attendance
      case 'occupied':
        return 'bg-red-500 hover:bg-red-600 text-white shadow-red-200'      // Default occupied
      case 'recently-freed':
        return 'bg-cyan-500 hover:bg-cyan-600 text-white shadow-cyan-200'    // Cyan for recently freed slots
      case 'maintenance':
        return 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200'  // Amber for maintenance
      case 'inactive':
        return 'bg-gray-400 hover:bg-gray-500 text-white shadow-gray-200'    // Gray for inactive
      default:
        return 'bg-gray-300 hover:bg-gray-400 text-gray-700 shadow-gray-100'
    }
  }

  // Get PC status icon for better visual identification
  const getPCStatusIcon = (status) => {
    switch (status) {
      case 'available':
        return '✅'
      case 'booked-present':
        return '👤'
      case 'booked-absent':
        return '❌'
      case 'booked-late':
        return '⏰'
      case 'booked-pending':
        return '⏳'
      case 'occupied':
        return '🔴'
      case 'recently-freed':
        return '🔄'
      case 'maintenance':
        return '🔧'
      case 'inactive':
        return '⚫'
      default:
        return '❓'
    }
  }



  // Handle PC click to show details
  const handlePCClick = (pc) => {
    setSelectedPC(pc)
    setShowPCDetailsModal(true)
  }

  // Handle time slot change with automatic data fetching
  const handleTimeSlotChange = async (timeSlotId) => {
    setSelectedTimeSlot(timeSlotId)
    // Immediately fetch data for the new time slot
    await fetchData(timeSlotId)
  }

  // Create sample PCs if none exist
  const handleCreateSamplePCs = async () => {
    try {
      setLoading(true)
      const result = await pcAPI.createSamplePCs()
      toast.success(result.message + ` (${result.count} PCs created)`)
      // Refresh data after creating PCs
      await fetchData()
    } catch (error) {
      console.error('Error creating sample PCs:', error)
      toast.error('Failed to create sample PCs: ' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  // Get time slot status color
  const getTimeSlotStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'starting-soon': return 'bg-yellow-500'
      case 'recently-ended': return 'bg-orange-500'
      case 'upcoming': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  // Get time slot status icon
  const getTimeSlotStatusIcon = (status) => {
    switch (status) {
      case 'active': return <PlayIcon className="h-3 w-3" />
      case 'starting-soon': return <ClockIcon className="h-3 w-3" />
      case 'recently-ended': return <PauseIcon className="h-3 w-3" />
      case 'upcoming': return <ClockIcon className="h-3 w-3" />
      default: return <StopIcon className="h-3 w-3" />
    }
  }





  return (
    <div className="space-y-8">
      {/* Enhanced Header with Real-Time Info */}
<div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mx-2 sm:mx-0">
  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
    <div>
      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="p-2 sm:p-3 bg-white/10 rounded-lg sm:rounded-xl shadow-md">
          <ComputerDesktopIcon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-white">Lab Availability</h1>
          <p className="mt-1 text-xs sm:text-sm text-primary-100">
            {labInfo ? labInfo.instituteName : 'CDC'} - Real-time PC Management
          </p>
        </div>
      </div>
    </div>
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
      <div className="text-right">
        <div className="text-xl sm:text-2xl font-bold text-white">{currentTime}</div>
        <div className="text-xs sm:text-sm text-primary-200">{currentDate}</div>
      </div>
      <div className="flex items-center space-x-1 sm:space-x-2 bg-white/10 rounded-lg sm:rounded-xl px-3 py-1 sm:px-4 sm:py-2">
        <ClockIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary-200" />
        <span className="text-xs sm:text-sm font-medium text-white">Live Status</span>
      </div>
    </div>
  </div>
</div>

{/* Enhanced Search and Filters - Stacked on mobile */}
<div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-4 sm:p-6 mx-2 sm:mx-0">
  <div className="flex flex-col space-y-3 sm:space-y-4">
    {/* Search Bar - Full width */}
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
      </div>
      <input
        type="text"
        placeholder="Search by student, teacher, or batch..."
        className="block w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-cadd-red focus:border-cadd-red focus:bg-white transition-all duration-300 text-xs sm:text-sm"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>

    {/* Filter Controls - Stacked on mobile */}
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 sm:space-y-0">
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:space-x-2 sm:space-y-0">
        <select
          value={selectedDepartment}
          onChange={(e) => {
            setSelectedDepartment(e.target.value)
            setSelectedBatch('all')
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-cadd-red focus:border-cadd-red transition-all duration-200 text-xs sm:text-sm bg-white"
        >
          <option value="all">All Depts</option>
          {departments.map(dept => (
            <option key={dept._id} value={dept._id}>
              {dept.name}
            </option>
          ))}
        </select>

        <select
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-cadd-red focus:border-cadd-red transition-all duration-200 text-xs sm:text-sm bg-white"
          disabled={selectedDepartment === 'all'}
        >
          <option value="all">
            {selectedDepartment === 'all' ? 'Select Dept' : 'All Batches'}
          </option>
          {selectedDepartment !== 'all' && batches
            .filter(batch => {
              const batchDept = batch.course?.department?._id || batch.course?.department
              return batchDept === selectedDepartment
            })
            .map(batch => (
              <option key={batch._id} value={batch._id}>
                {batch.name}
              </option>
            ))
          }
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-cadd-red focus:border-cadd-red transition-all duration-200 text-xs sm:text-sm bg-white"
        >
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      <div className="flex items-center justify-between sm:space-x-2">
        <span className="text-xs sm:text-sm text-gray-500">
          {getFilteredBookings().length} bookings
        </span>
        <button
          onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-2 border border-gray-300 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-all duration-200"
        >
          <FunnelIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          {viewMode === 'grid' ? 'List' : 'Grid'}
        </button>
      </div>
    </div>
  </div>
</div>

{/* Lab Information Cards - Stacked on mobile */}
{labInfo && !labInfoLoading && (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mx-2 sm:mx-0">
    {/* Card 1 - Facility Info */}
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-4 sm:p-6">
      <div className="flex items-center mb-3 sm:mb-4">
        <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md sm:shadow-lg">
          <BuildingOfficeIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
        </div>
        <div className="ml-3 sm:ml-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Facility Info</h3>
          <p className="text-xs sm:text-sm text-gray-500">{labInfo.instituteType}</p>
        </div>
      </div>
      <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600">
        <div className="flex items-center">
          <MapPinIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-gray-400" />
          <span className="truncate">{labInfo.location?.address}</span>
        </div>
        <div className="flex items-center">
          <ClockIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-gray-400" />
          <span>{labInfo.facilities?.operatingHours?.weekdays}</span>
        </div>
      </div>
    </div>

    {/* Card 2 - Contact Info */}
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-4 sm:p-6">
      <div className="flex items-center mb-3 sm:mb-4">
        <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-md sm:shadow-lg">
          <PhoneIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
        </div>
        <div className="ml-3 sm:ml-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Contact Info</h3>
          <p className="text-xs sm:text-sm text-gray-500">Get in touch</p>
        </div>
      </div>
      <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600">
        <div className="flex items-center">
          <PhoneIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-gray-400" />
          <span>{labInfo.contact?.phone}</span>
        </div>
        <div className="flex items-center">
          <EnvelopeIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-gray-400" />
          <span className="truncate">{labInfo.contact?.email}</span>
        </div>
      </div>
    </div>

    {/* Card 3 - Lab Stats */}
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-4 sm:p-6">
      <div className="flex items-center mb-3 sm:mb-4">
        <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-md sm:shadow-lg">
          <ComputerDesktopIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
        </div>
        <div className="ml-3 sm:ml-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Lab Stats</h3>
          <p className="text-xs sm:text-sm text-gray-500">Current status</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="text-center">
          <p className="text-xl sm:text-2xl font-bold text-blue-600">{labInfo.facilities?.totalPCs}</p>
          <p className="text-xs text-gray-500">Total PCs</p>
        </div>
        <div className="text-center">
          <p className="text-xl sm:text-2xl font-bold text-green-600">{labInfo.facilities?.totalLabs}</p>
          <p className="text-xs text-gray-500">Labs</p>
        </div>
      </div>
    </div>
  </div>
)}

{/* Status Overview Cards - 2 columns on mobile */}
<div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mx-2 sm:mx-0">
  {/* Card 4 - Total PCs */}
  <div className="bg-white overflow-hidden shadow-md sm:shadow-lg rounded-xl sm:rounded-2xl border border-gray-100 hover:shadow-lg sm:hover:shadow-xl transition-all duration-300">
    <div className="p-4 sm:p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl shadow-md sm:shadow-lg">
            <ComputerDesktopIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
        </div>
        <div className="ml-3 w-0 flex-1">
          <dl>
            <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Total PCs</dt>
            <dd className="text-xl sm:text-2xl font-bold text-gray-900">{getTotalCount()}</dd>
            <dd className="text-[10px] sm:text-xs text-gray-400">in lab</dd>
          </dl>
        </div>
      </div>
    </div>
  </div>

  {/* Card 5 - Available */}
  <div className="bg-white overflow-hidden shadow-md sm:shadow-lg rounded-xl sm:rounded-2xl border border-green-100 hover:shadow-lg sm:hover:shadow-xl transition-all duration-300 hover:border-green-200">
    <div className="p-4 sm:p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="p-2 sm:p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-lg sm:rounded-xl shadow-md sm:shadow-lg">
            <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
        </div>
        <div className="ml-3 w-0 flex-1">
          <dl>
            <dt className="text-xs sm:text-sm font-medium text-green-600 truncate flex items-center">
              <span className="mr-1">✅</span>
              Available PCs
            </dt>
            <dd className="text-xl sm:text-2xl font-bold text-green-700">{getAvailableCount(selectedTimeSlot)}</dd>
            <dd className="text-[10px] sm:text-xs text-green-500">for {getTimeSlotLabel(selectedTimeSlot)}</dd>
          </dl>
        </div>
      </div>
    </div>
  </div>

  {/* Card 6 - Occupied */}
  <div className="bg-white overflow-hidden shadow-md sm:shadow-lg rounded-xl sm:rounded-2xl border border-gray-100 hover:shadow-lg sm:hover:shadow-xl transition-all duration-300">
    <div className="p-4 sm:p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="p-2 sm:p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-lg sm:rounded-xl shadow-md sm:shadow-lg">
            <XCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
        </div>
        <div className="ml-3 w-0 flex-1">
          <dl>
            <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Occupied</dt>
            <dd className="text-xl sm:text-2xl font-bold text-gray-900">
              {getFilteredBookings().filter(b => b.timeSlot === selectedTimeSlot && b.isActive).length}
            </dd>
            <dd className="text-[10px] sm:text-xs text-gray-400">current slot</dd>
          </dl>
        </div>
      </div>
    </div>
  </div>

  {/* Card 7 - Maintenance */}
  <div className="bg-white overflow-hidden shadow-md sm:shadow-lg rounded-xl sm:rounded-2xl border border-gray-100 hover:shadow-lg sm:hover:shadow-xl transition-all duration-300">
    <div className="p-4 sm:p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="p-2 sm:p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg sm:rounded-xl shadow-md sm:shadow-lg">
            <ExclamationTriangleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
        </div>
        <div className="ml-3 w-0 flex-1">
          <dl>
            <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Maintenance</dt>
            <dd className="text-xl sm:text-2xl font-bold text-gray-900">
              {Object.values(filteredPCs).flat().filter(pc => pc.status === 'maintenance').length}
            </dd>
            <dd className="text-[10px] sm:text-xs text-gray-400">under repair</dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
</div>

      {/* Enhanced Time Slot Selection with Real-Time Status */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between lg:space-x-6 mb-6">
          <div className="flex-shrink-0">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Time Slot Selection</h3>
            <p className="text-sm text-gray-600">
              Auto-selected based on current time • Click to change manually
            </p>
          </div>
          <div className="mt-4 lg:mt-0 flex items-center space-x-2 bg-primary-50 rounded-xl px-4 py-2">
            <ClockIcon className="h-5 w-5 text-primary-500" />
            <span className="text-sm font-medium text-primary-700">Real-Time Lab Status</span>
          </div>
        </div>

        {/* Responsive Time Slots with Real-Time Status */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {timeSlots.map((slot) => {
            const filteredBookings = getFilteredBookings();
            const occupiedCount = filteredBookings.filter(
              (b) => b.timeSlot === slot.id && b.isActive
            ).length;
            const availableCount = getAvailableCount(slot.id);
            const totalCount = getTotalCount();
            const isSelected = selectedTimeSlot === slot.id;
            const timeStatus = getTimeSlotStatus(slot.label);

            return (
              <button
                key={slot.id}
                onClick={() => handleTimeSlotChange(slot.id)}
                className={`relative text-center p-3 sm:p-4 text-sm sm:text-base rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${isSelected
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg ring-2 ring-primary-500 ring-opacity-50'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-900 border-2 border-transparent hover:border-gray-200'
                  }`}
              >
                {/* Real-time status badge */}
                {timeStatus.status !== 'ended' && (
                  <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium text-white ${getTimeSlotStatusColor(timeStatus.status)}`}>
                    <div className="flex items-center space-x-1">
                      {getTimeSlotStatusIcon(timeStatus.status)}
                      <span className="hidden sm:inline">{timeStatus.label}</span>
                    </div>
                  </div>
                )}

                <div className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-900'} ${timeStatus.status !== 'ended' ? 'pr-8' : ''}`}>
                  {slot.label}
                </div>
                <div className={`text-xs mt-1 ${isSelected ? 'text-white opacity-90' : 'text-gray-500'}`}>
                  {availableCount}/{totalCount} available
                </div>
                <div className={`text-xs mt-1 ${isSelected ? 'text-white opacity-75' : 'text-gray-400'}`}>
                  {occupiedCount} occupied
                </div>
                {isSelected && (
                  <div className="mt-2">
                    <div className="w-2 h-2 bg-white rounded-full mx-auto animate-pulse"></div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Auto-selection indicator */}
        {autoSelected && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center text-sm text-blue-700">
              <ClockIcon className="h-4 w-4 mr-2" />
              <span>Time slot auto-selected based on current time ({currentTime})</span>
            </div>
          </div>
        )}
      </div>


      {loading ? (
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex flex-col items-center justify-center min-h-64">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent absolute top-0 left-0"></div>
            </div>
            <div className="mt-4 text-center">
              <h3 className="text-lg font-semibold text-gray-900">Loading PC Data</h3>
              <p className="text-sm text-gray-600 mt-1">
                Fetching real-time availability for {getTimeSlotLabel(selectedTimeSlot)}
              </p>
            </div>
          </div>
        </div>
      ) : Object.keys(pcsByRow).length > 0 ? (
        <div className="space-y-6">

          {/* Detailed Availability Grid */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Detailed Availability</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Real-time PC status for {getTimeSlotLabel(selectedTimeSlot)}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <ClockIcon className="h-4 w-4" />
                    <span>Last updated: {currentTime}</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => fetchData()}
                      disabled={loading}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-primary-500"></div>
                      ) : (
                        <>
                          <ClockIcon className="h-4 w-4 mr-1" />
                          Refresh
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => fetchData()}
                      disabled={loading}
                      className="inline-flex items-center px-3 py-2 border border-primary-300 shadow-sm text-sm font-medium rounded-lg text-primary-700 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      🔄 Force Sync
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Enhanced Status Legend */}
              <div className="mb-6 p-5 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 shadow-sm">
                <h4 className="text-base font-bold text-gray-800 mb-2 flex items-center">
                  <span className="mr-2">🎨</span>
                  Smart Color-Coded PC Status
                </h4>
                <p className="text-sm text-gray-600 mb-4">Real-time status indicators with attendance integration and enhanced visual feedback</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-center p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                    <div className="w-5 h-5 bg-green-500 rounded-lg mr-3 shadow-sm flex items-center justify-center text-white text-xs font-bold">✅</div>
                    <span className="font-medium text-gray-700">Available</span>
                  </div>
                  <div className="flex items-center p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                    <div className="w-5 h-5 bg-orange-500 rounded-lg mr-3 shadow-sm flex items-center justify-center text-white text-xs font-bold">👤</div>
                    <span className="font-medium text-gray-700">Present</span>
                  </div>
                  <div className="flex items-center p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                    <div className="w-5 h-5 bg-red-500 rounded-lg mr-3 shadow-sm flex items-center justify-center text-white text-xs font-bold">❌</div>
                    <span className="font-medium text-gray-700">Absent</span>
                  </div>
                  <div className="flex items-center p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                    <div className="w-5 h-5 bg-yellow-500 rounded-lg mr-3 shadow-sm flex items-center justify-center text-white text-xs font-bold">⏰</div>
                    <span className="font-medium text-gray-700">Late</span>
                  </div>
                  <div className="flex items-center p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                    <div className="w-5 h-5 bg-blue-500 rounded-lg mr-3 shadow-sm flex items-center justify-center text-white text-xs font-bold">⏳</div>
                    <span className="font-medium text-gray-700">Pending</span>
                  </div>
                  <div className="flex items-center p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                    <div className="w-5 h-5 bg-cyan-500 rounded-lg mr-3 shadow-sm flex items-center justify-center text-white text-xs font-bold">🔄</div>
                    <span className="font-medium text-gray-700">Recently Freed</span>
                  </div>
                  <div className="flex items-center p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                    <div className="w-5 h-5 bg-amber-500 rounded-lg mr-3 shadow-sm flex items-center justify-center text-white text-xs font-bold">🔧</div>
                    <span className="font-medium text-gray-700">Maintenance</span>
                  </div>
                  <div className="flex items-center p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                    <div className="w-5 h-5 bg-gray-400 rounded-lg mr-3 shadow-sm flex items-center justify-center text-white text-xs font-bold">⚫</div>
                    <span className="font-medium text-gray-700">Inactive</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-700 flex items-center">
                    <span className="mr-2">💡</span>
                    <span><strong>Pro Tip:</strong> Colors automatically update based on real-time attendance status. Orange indicates students are present and actively using the PC.</span>
                  </p>
                </div>
              </div>

              {Object.keys(getPCsByRows()).length === 0 ? (
                <div className="text-center py-12">
                  <ComputerDesktopIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No PCs found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No computers are available for the selected date.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(getPCsByRows()).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([rowNumber, rowPCs]) => (
                    <div key={rowNumber} className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900">Row {rowNumber}</h3>
                        <div className="flex-1 h-px bg-gray-200"></div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9 gap-3">
                        {rowPCs.map((pc) => {
                          const pcAvailability = getPCAvailability(pc.pcNumber, pc.rowNumber)
                          return (
                            <div
                              key={`${pc.rowNumber}-${pc.pcNumber}`}
                              onClick={() => handlePCClick(pc)}
                              className={`
                                relative p-4 rounded-xl text-center text-sm font-medium transition-all duration-300 cursor-pointer group
                                ${getPCStatusColor(pcAvailability.status)}
                                transform hover:scale-110 shadow-lg hover:shadow-xl
                                border-2 border-transparent hover:border-white/30
                                backdrop-blur-sm
                              `}
                              title={
                                pcAvailability.status === 'available'
                                  ? `${pc.pcNumber} - Available for booking`
                                  : pcAvailability.status === 'maintenance'
                                    ? `${pc.pcNumber} - Under Maintenance`
                                    : pcAvailability.status === 'recently-freed'
                                      ? `${pc.pcNumber} - Recently freed (${pcAvailability.bookedFor} left)`
                                      : `${pc.pcNumber} - Occupied by ${pcAvailability.bookedFor}`
                              }
                            >
                              {/* Status Icon Badge */}
                              <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center text-sm border-2 border-gray-100">
                                {getPCStatusIcon(pcAvailability.status)}
                              </div>

                              {/* PC Number with enhanced styling */}
                              <div className="font-bold text-lg mb-1 drop-shadow-sm">{pc.pcNumber}</div>

                              {/* Enhanced Status Pulse Indicator */}
                              <div className="absolute top-1 left-1">
                                {(pcAvailability.status === 'available' || pcAvailability.status.startsWith('booked-')) && (
                                  <div className={`w-3 h-3 rounded-full animate-pulse shadow-lg ${
                                    pcAvailability.status === 'available'
                                      ? 'bg-green-300'
                                      : pcAvailability.status === 'booked-present'
                                        ? 'bg-orange-300'
                                        : pcAvailability.status === 'booked-absent'
                                          ? 'bg-red-300'
                                          : pcAvailability.status === 'booked-late'
                                            ? 'bg-yellow-300'
                                            : 'bg-blue-300'
                                  }`}></div>
                                )}
                                {pcAvailability.status === 'recently-freed' && (
                                  <div className="w-3 h-3 bg-cyan-300 rounded-full animate-bounce shadow-lg"></div>
                                )}
                                {pcAvailability.status === 'maintenance' && (
                                  <div className="w-3 h-3 bg-amber-300 rounded-full animate-pulse shadow-lg"></div>
                                )}
                              </div>

                              {/* Enhanced Status text with detailed info */}
                              {pcAvailability.status.startsWith('booked-') && (
                                <div className="text-xs mt-1 opacity-95 font-medium">
                                  <div className="truncate text-white/95 font-semibold">{pcAvailability.bookedFor}</div>
                                  <div className="text-[10px] opacity-90 mt-0.5 flex items-center justify-center">
                                    {pcAvailability.attendanceStatus === 'present' && (
                                      <span className="bg-white/20 px-1.5 py-0.5 rounded-full">✅ Present</span>
                                    )}
                                    {pcAvailability.attendanceStatus === 'absent' && (
                                      <span className="bg-white/20 px-1.5 py-0.5 rounded-full">❌ Absent</span>
                                    )}
                                    {pcAvailability.attendanceStatus === 'late' && (
                                      <span className="bg-white/20 px-1.5 py-0.5 rounded-full">⏰ Late</span>
                                    )}
                                    {(!pcAvailability.attendanceStatus || pcAvailability.attendanceStatus === 'not-marked') && (
                                      <span className="bg-white/20 px-1.5 py-0.5 rounded-full">⏳ Pending</span>
                                    )}
                                  </div>
                                </div>
                              )}
                              {pcAvailability.status === 'occupied' && (
                                <div className="text-xs mt-1 opacity-95 font-medium">
                                  <div className="truncate text-white/95 font-semibold">{pcAvailability.bookedFor}</div>
                                  <div className="text-[10px] opacity-90 mt-0.5">
                                    <span className="bg-white/20 px-1.5 py-0.5 rounded-full">🔴 Occupied</span>
                                  </div>
                                </div>
                              )}
                              {pcAvailability.status === 'recently-freed' && (
                                <div className="text-xs mt-1 opacity-95 font-medium">
                                  <div className="text-white/95 font-semibold">Recently Freed</div>
                                  <div className="text-[10px] opacity-90 mt-0.5">
                                    <span className="bg-white/20 px-1.5 py-0.5 rounded-full">🔄 Available Soon</span>
                                  </div>
                                </div>
                              )}
                              {pcAvailability.status === 'maintenance' && (
                                <div className="text-xs mt-1 opacity-95 font-medium">
                                  <div className="text-white/95 font-semibold">Maintenance</div>
                                  <div className="text-[10px] opacity-90 mt-0.5">
                                    <span className="bg-white/20 px-1.5 py-0.5 rounded-full">🔧 Under Repair</span>
                                  </div>
                                </div>
                              )}
                              {pcAvailability.status === 'available' && (
                                <div className="text-xs mt-1 opacity-95 font-medium">
                                  <div className="text-white/95 font-semibold">Available</div>
                                  <div className="text-[10px] opacity-90 mt-0.5">
                                    <span className="bg-white/20 px-1.5 py-0.5 rounded-full">✅ Ready to Book</span>
                                  </div>
                                </div>
                              )}
                              {pcAvailability.status === 'inactive' && (
                                <div className="text-xs mt-1 opacity-95 font-medium">
                                  <div className="text-white/95 font-semibold">Inactive</div>
                                  <div className="text-[10px] opacity-90 mt-0.5">
                                    <span className="bg-white/20 px-1.5 py-0.5 rounded-full">⚫ Offline</span>
                                  </div>
                                </div>
                              )}

                              {/* Hover effect overlay */}
                              <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                              {/* Click ripple effect */}
                              <div className="absolute inset-0 rounded-xl bg-white/20 scale-0 group-active:scale-100 transition-transform duration-150 pointer-events-none"></div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center py-12">
            <ComputerDesktopIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No PCs Found</h3>
            <p className="mt-1 text-sm text-gray-500 mb-6">
              No computers are available in the lab database. Create sample PCs to get started.
            </p>
            <button
              onClick={handleCreateSamplePCs}
              disabled={loading}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Creating Sample PCs...
                </>
              ) : (
                <>
                  <ComputerDesktopIcon className="h-5 w-5 mr-2" />
                  Create Sample PCs (40 PCs)
                </>
              )}
            </button>
            <p className="mt-3 text-xs text-gray-400">
              This will create 4 rows with 10 PCs each for testing purposes
            </p>
          </div>
        </div>
      )}



      {/* PC Details Modal */}
      {showPCDetailsModal && selectedPC && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  PC {selectedPC.pcNumber} Details
                </h3>
                <button
                  onClick={() => setShowPCDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              {/* PC Information */}
              <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 mb-6 border border-gray-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 flex items-center">
                      <ComputerDesktopIcon className="h-4 w-4 mr-1" />
                      PC Number
                    </div>
                    <div className="font-semibold text-gray-900 text-lg">{selectedPC.pcNumber}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      Row
                    </div>
                    <div className="font-semibold text-gray-900 text-lg">Row {selectedPC.rowNumber}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      Time Slot
                    </div>
                    <div className="font-semibold text-gray-900">
                      {getTimeSlotLabel(selectedTimeSlot)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Status</div>
                    <div className={`font-semibold text-lg ${getPCAvailability(selectedPC.pcNumber, selectedPC.rowNumber).status === 'available'
                      ? 'text-green-600'
                      : getPCAvailability(selectedPC.pcNumber, selectedPC.rowNumber).status === 'maintenance'
                        ? 'text-yellow-600'
                        : getPCAvailability(selectedPC.pcNumber, selectedPC.rowNumber).status === 'recently-freed'
                          ? 'text-blue-600'
                          : 'text-red-600'
                      }`}>
                      {getPCAvailability(selectedPC.pcNumber, selectedPC.rowNumber).status === 'available'
                        ? '✅ Available'
                        : getPCAvailability(selectedPC.pcNumber, selectedPC.rowNumber).status === 'maintenance'
                          ? '🔧 Maintenance'
                          : getPCAvailability(selectedPC.pcNumber, selectedPC.rowNumber).status === 'recently-freed'
                            ? '🔵 Recently Freed'
                            : '🔴 Occupied'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Booking Details */}
              {(() => {
                const pcAvailability = getPCAvailability(selectedPC.pcNumber, selectedPC.rowNumber)
                if (pcAvailability.status === 'occupied' && pcAvailability.booking) {
                  return (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                      <h4 className="text-lg font-semibold text-red-800 mb-3 flex items-center">
                        <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                        Current Booking
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-red-600">Student</div>
                          <div className="font-semibold text-red-800">{pcAvailability.booking.studentName}</div>
                        </div>
                        <div>
                          <div className="text-sm text-red-600">Teacher</div>
                          <div className="font-semibold text-red-800">{pcAvailability.booking.teacherName}</div>
                        </div>
                        <div>
                          <div className="text-sm text-red-600">Purpose</div>
                          <div className="font-semibold text-red-800">{pcAvailability.booking.purpose}</div>
                        </div>
                        <div>
                          <div className="text-sm text-red-600">Time Slot</div>
                          <div className="font-semibold text-red-800">{getTimeSlotLabel(pcAvailability.booking.timeSlot)}</div>
                        </div>
                      </div>
                      {pcAvailability.booking.notes && (
                        <div className="mt-3">
                          <div className="text-sm text-red-600">Notes</div>
                          <div className="font-semibold text-red-800">{pcAvailability.booking.notes}</div>
                        </div>
                      )}
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-700">
                          <span className="font-medium">Note:</span> Lab slots are automatically freed when students are marked absent/late in attendance.
                        </p>
                      </div>
                    </div>
                  )
                }
                return null
              })()}

              {/* Availability for All Time Slots */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2 text-blue-500" />
                  Availability for All Time Slots
                </h4>
                <div className="space-y-2">
                  {timeSlots.map((slot) => {
                    const slotAvailability = getPCAvailability(selectedPC.pcNumber, selectedPC.rowNumber)
                    const slotBooking = getBookingForPCAndTime(selectedPC._id, slot.id)
                    const isCurrentSlot = slot.id === selectedTimeSlot

                    return (
                      <div
                        key={slot.id}
                        className={`p-3 rounded-lg border ${isCurrentSlot
                          ? 'border-cadd-red bg-red-50'
                          : 'border-gray-200 bg-gray-50'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                            <span className={`font-medium ${isCurrentSlot ? 'text-cadd-red' : 'text-gray-900'}`}>
                              {slot.label}
                            </span>
                            {isCurrentSlot && (
                              <span className="ml-2 px-2 py-1 bg-cadd-red text-white text-xs rounded-full">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="flex items-center">
                            {slotBooking ? (
                              <span className="text-red-600 font-medium text-sm">
                                🔴 Occupied by {slotBooking.studentName}
                              </span>
                            ) : (
                              <span className="text-green-600 font-medium text-sm">
                                ✅ Available
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowPCDetailsModal(false)}
                  className="px-6 py-2 bg-gradient-to-r from-cadd-red to-cadd-pink text-white rounded-lg hover:from-cadd-pink hover:to-cadd-red transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  )
}

export default LabAvailability
