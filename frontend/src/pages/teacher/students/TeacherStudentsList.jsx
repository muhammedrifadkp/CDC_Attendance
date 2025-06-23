import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { studentsAPI, batchesAPI, coursesAPI } from '../../../services/api'
import api from '../../../services/api'
import {
  UserIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  AcademicCapIcon,
  ClockIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useAuth } from '../../../context/AuthContext'
import { formatDateSimple } from '../../../utils/dateUtils'
import BackButton from '../../../components/BackButton'

const TeacherStudentsList = () => {
  const { user } = useAuth()
  const [students, setStudents] = useState([])
  const [batches, setBatches] = useState([])
  const [courses, setCourses] = useState([])
  const [departments, setDepartments] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBatch, setSelectedBatch] = useState('all')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [selectedCourse, setSelectedCourse] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'table'

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
    const fetchData = async () => {
      try {
        setLoading(true)
        const [studentsRes, batchesRes, coursesRes, departmentsRes] = await Promise.all([
          studentsAPI.getStudents(),
          batchesAPI.getBatches(),
          api.get('/courses?active=true'),
          api.get('/departments?active=true')
        ])

        // Handle students response structure
        const studentsData = studentsRes.data?.students || studentsRes.data || []
        setStudents(studentsData)
        setBatches(batchesRes.data || [])
        setCourses(coursesRes.data?.courses || coursesRes.data || [])

        // Filter departments to only include the 4 required ones
        const allDepartments = departmentsRes.data || []
        const requiredDepartments = allDepartments.filter(dept =>
          ['CADD', 'LIVEWIRE', 'DREAMZONE', 'SYNERGY'].includes(dept.name)
        )
        setDepartments(requiredDepartments)
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to fetch students data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    let filtered = students

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.contactInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.batch?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.course?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.department?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by department
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(student => {
        const studentDept = student.department?._id || student.department
        return studentDept === selectedDepartment
      })
    }

    // Filter by course
    if (selectedCourse !== 'all') {
      filtered = filtered.filter(student => {
        const studentCourse = student.course?._id || student.course
        return studentCourse === selectedCourse
      })
    }

    // Filter by batch
    if (selectedBatch !== 'all') {
      filtered = filtered.filter(student => student.batch?._id === selectedBatch)
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(student =>
        selectedStatus === 'active' ? student.isActive : !student.isActive
      )
    }

    setFilteredStudents(filtered)
  }, [students, searchTerm, selectedDepartment, selectedCourse, selectedBatch, selectedStatus])

  const getStudentStats = () => {
    const total = students.length
    const active = students.filter(s => s.isActive).length
    const inactive = total - active
    const batchCount = new Set(students.map(s => s.batch?._id).filter(Boolean)).size

    return { total, active, inactive, batchCount }
  }

  const stats = getStudentStats()

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

  return (
    <div className="space-y-6 sm:space-y-8">
  {/* Back Button */}
  <div className="flex items-center px-2 sm:px-0">
    <BackButton />
  </div>

  {/* Enhanced Header - Mobile Optimized */}
  <div className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl mx-2 sm:mx-0">
    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 pointer-events-none"></div>
    <div className="relative px-4 py-8 sm:px-8 sm:py-12 z-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">
            <UserIcon className="inline h-6 w-6 sm:h-10 sm:w-10 mr-2 sm:mr-3 text-blue-400" />
            All Students
          </h1>
          <p className="text-sm sm:text-xl text-gray-300 mb-3 sm:mb-4">
            Comprehensive view of all students across batches
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs sm:text-sm text-gray-400">
            <span className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-1 sm:mr-2"></div>
              System Online
            </span>
            <span className="flex items-center">
              <CalendarDaysIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              {formatDateSimple(new Date())}
            </span>
          </div>
        </div>
        <div className="hidden lg:block mt-4 sm:mt-0">
          <img
            className="h-16 sm:h-20 w-auto opacity-80"
            src="/logos/cadd_logo.png"
            alt="CADD Centre"
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />
        </div>
      </div>
    </div>
  </div>

  {/* Stats Cards - Mobile 2 columns */}
  <div className="grid grid-cols-2 gap-3 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4 px-2 sm:px-0">
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-6 hover:shadow-lg sm:hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] sm:hover:scale-105">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs sm:text-sm font-medium text-gray-600">Total Students</p>
          <p className="text-xl sm:text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow sm:shadow-lg">
          <UserIcon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
        </div>
      </div>
    </div>

    <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-6 hover:shadow-lg sm:hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] sm:hover:scale-105">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs sm:text-sm font-medium text-gray-600">Active Students</p>
          <p className="text-xl sm:text-3xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow sm:shadow-lg">
          <CheckCircleIcon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
        </div>
      </div>
    </div>

    <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-6 hover:shadow-lg sm:hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] sm:hover:scale-105">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs sm:text-sm font-medium text-gray-600">Inactive Students</p>
          <p className="text-xl sm:text-3xl font-bold text-red-600">{stats.inactive}</p>
        </div>
        <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow sm:shadow-lg">
          <XCircleIcon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
        </div>
      </div>
    </div>

    <div className="bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-6 hover:shadow-lg sm:hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] sm:hover:scale-105">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs sm:text-sm font-medium text-gray-600">Total Batches</p>
          <p className="text-xl sm:text-3xl font-bold text-purple-600">{stats.batchCount}</p>
        </div>
        <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow sm:shadow-lg">
          <UserGroupIcon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
        </div>
      </div>
    </div>
  </div>

  {/* Filters and Search - Stacked on mobile */}
  <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mx-2 sm:mx-0">
    <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
      {/* Search - Full width on mobile */}
      <div className="w-full sm:max-w-md">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, student ID, roll number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-cadd-red focus:border-cadd-red transition-all duration-200 text-sm sm:text-base"
          />
        </div>
      </div>

      {/* Filters - Stacked on mobile */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:space-x-2 sm:space-y-0">
        <select
          value={selectedDepartment}
          onChange={(e) => {
            setSelectedDepartment(e.target.value)
            setSelectedCourse('all')
          }}
          className="px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-cadd-red focus:border-cadd-red transition-all duration-200 text-xs sm:text-sm"
        >
          <option value="all">All Depts</option>
          {departments.map(dept => (
            <option key={dept._id} value={dept._id}>
              {dept.name}
            </option>
          ))}
        </select>

        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-cadd-red focus:border-cadd-red transition-all duration-200 text-xs sm:text-sm"
          disabled={selectedDepartment === 'all'}
        >
          <option value="all">
            {selectedDepartment === 'all' ? 'Select Dept' : 'All Courses'}
          </option>
          {selectedDepartment !== 'all' && courses
            .filter(course => {
              const courseDept = course.department?._id || course.department
              return courseDept === selectedDepartment
            })
            .map(course => (
              <option key={course._id} value={course._id}>
                {course.name}
              </option>
            ))
          }
        </select>

        <select
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
          className="px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-cadd-red focus:border-cadd-red transition-all duration-200 text-xs sm:text-sm"
        >
          <option value="all">All Batches</option>
          {batches.map(batch => (
            <option key={batch._id} value={batch._id}>
              {batch.name}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-cadd-red focus:border-cadd-red transition-all duration-200 text-xs sm:text-sm"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <button
          onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
          className="px-3 py-2 sm:px-4 sm:py-3 bg-gray-100 hover:bg-gray-200 rounded-lg sm:rounded-xl transition-all duration-200 flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm"
        >
          <FunnelIcon className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>{viewMode === 'grid' ? 'Table' : 'Grid'}</span>
        </button>
      </div>
    </div>

    <div className="mt-3 text-xs sm:text-sm text-gray-600">
      Showing {filteredStudents.length} of {students.length} students
    </div>
  </div>

  {/* Students Display */}
  {filteredStudents.length === 0 ? (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-12 text-center mx-2 sm:mx-0">
      <UserIcon className="mx-auto h-10 w-10 sm:h-16 sm:w-16 text-gray-400 mb-3 sm:mb-4" />
      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-2">No students found</h3>
      <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
        {searchTerm || selectedDepartment !== 'all' || selectedCourse !== 'all' || selectedBatch !== 'all' || selectedStatus !== 'all'
          ? 'Try adjusting your search or filter criteria.'
          : 'No students have been added yet.'}
      </p>
      {(!searchTerm && selectedDepartment === 'all' && selectedCourse === 'all' && selectedBatch === 'all' && selectedStatus === 'all') && (
        <Link
          to="/batches"
          className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 border border-transparent text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl text-white bg-gradient-to-r from-cadd-red to-cadd-pink hover:from-cadd-pink hover:to-cadd-red transition-all duration-300"
        >
          <UserGroupIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
          Manage Batches
        </Link>
      )}
    </div>
  ) : viewMode === 'grid' ? (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 px-2 sm:px-0">
      {filteredStudents.map((student, index) => (
        <div
          key={student._id}
          className="group bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg hover:shadow-lg sm:hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] sm:hover:scale-105 overflow-hidden"
        >
          {/* Student Header */}
          <div className="relative p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-white">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="relative">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-cadd-red to-cadd-pink rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm sm:text-xl">
                    {student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-white ${student.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-lg font-bold text-gray-900 truncate group-hover:text-cadd-red transition-colors duration-300">
                  {student.name}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">
                  {student.studentId && `ID: ${student.studentId} • `}Roll: {student.rollNo}
                </p>
                {student.batch?.timing && (
                  <div className="flex items-center mt-1 text-[10px] sm:text-xs text-cadd-red font-semibold">
                    <ClockIcon className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                    {formatTiming(student.batch.timing)}
                  </div>
                )}
                <div className={`inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium mt-1 ${student.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
                  }`}>
                  {student.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
          </div>

          {/* Student Details */}
          <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
            {/* Department & Course Information */}
            <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
              <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                <AcademicCapIcon className="h-4 w-4 sm:h-5 sm:w-5 text-cadd-red" />
                <span className="font-semibold text-gray-900 text-xs sm:text-sm">Academic Details</span>
              </div>
              <div className="space-y-1 sm:space-y-2 text-[10px] sm:text-sm">
                {student.department && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Dept:</span>
                    <span className="font-medium text-gray-900 truncate pl-2">
                      {student.department.name || student.department}
                    </span>
                  </div>
                )}
                {student.course && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Course:</span>
                    <span className="font-medium text-gray-900 truncate pl-2">
                      {student.course.name || student.course}
                    </span>
                  </div>
                )}
                {student.batch && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Batch:</span>
                      <span className="font-medium text-gray-900 truncate pl-2">{student.batch.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Year:</span>
                      <span className="font-medium text-gray-900 truncate pl-2">{student.batch.academicYear}</span>
                    </div>
                    {student.batch.timing && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Time:</span>
                        <span className="font-medium text-cadd-red truncate pl-2">
                          {formatTiming(student.batch.timing)}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-1 sm:space-y-2">
              <h4 className="font-semibold text-gray-900 text-xs sm:text-sm">Contact</h4>
              <div className="space-y-1 text-[10px] sm:text-sm">
                {(student.email || student.contactInfo?.email) && (
                  <div className="flex items-center space-x-1 sm:space-x-2 text-gray-600 truncate">
                    <EnvelopeIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                    <span className="truncate">{student.email || student.contactInfo.email}</span>
                  </div>
                )}
                {(student.phone || student.contactInfo?.phone) && (
                  <div className="flex items-center space-x-1 sm:space-x-2 text-gray-600">
                    <PhoneIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                    <span>{student.phone || student.contactInfo.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Enrollment Date */}
            <div className="pt-1 sm:pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-500">
                <span>Enrolled: {formatDateSimple(student.createdAt)}</span>
                {student.batch && (
                  <Link
                    to={`/batches/${student.batch._id}/students`}
                    className="text-cadd-red hover:text-cadd-pink font-medium transition-colors duration-200 text-xs"
                  >
                    View Batch
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-4 pb-4 sm:px-6 sm:pb-6">
            <div className="flex space-x-2">
              {student.batch && (
                <Link
                  to={`/batches/${student.batch._id}/students/${student._id}/edit`}
                  className="flex-1 inline-flex items-center justify-center px-2 py-1 sm:px-3 sm:py-2 border border-gray-300 text-xs sm:text-sm font-medium rounded-md sm:rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                >
                  <PencilIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Edit
                </Link>
              )}
              <button className="flex-1 inline-flex items-center justify-center px-2 py-1 sm:px-3 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md sm:rounded-lg text-white bg-gradient-to-r from-cadd-red to-cadd-pink hover:from-cadd-pink hover:to-cadd-red transition-all duration-200">
                <EyeIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                View
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  ) : (
    // Table View - Scrollable on mobile
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden mx-2 sm:mx-0">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th scope="col" className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dept
              </th>
              <th scope="col" className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Course
              </th>
              <th scope="col" className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Batch
              </th>
              <th scope="col" className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th scope="col" className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStudents.map((student) => (
              <tr key={student._id} className="hover:bg-gray-50 transition-colors duration-200">
                <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-cadd-red to-cadd-pink rounded-full flex items-center justify-center shadow-lg mr-2 sm:mr-4">
                      <span className="text-white font-bold text-xs sm:text-sm">
                        {student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[100px] sm:max-w-none">{student.name}</div>
                      <div className="text-xs text-gray-500">
                        {student.studentId && `ID: ${student.studentId} • `}Roll: {student.rollNo}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                  {student.department ? (
                    <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[80px] sm:max-w-none">
                      {student.department.name || student.department}
                    </div>
                  ) : (
                    <span className="text-xs sm:text-sm text-gray-500">-</span>
                  )}
                </td>
                <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                  {student.course ? (
                    <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[80px] sm:max-w-none">
                      {student.course.name || student.course}
                    </div>
                  ) : (
                    <span className="text-xs sm:text-sm text-gray-500">-</span>
                  )}
                </td>
                <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                  {student.batch ? (
                    <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[80px] sm:max-w-none">
                      {student.batch.name}
                    </div>
                  ) : (
                    <span className="text-xs sm:text-sm text-gray-500">-</span>
                  )}
                </td>
                <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                  <div className="text-xs sm:text-sm text-gray-900">
                    {(student.email || student.contactInfo?.email) && (
                      <div className="flex items-center mb-1">
                        <EnvelopeIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 mr-1" />
                        <span className="truncate max-w-[80px] sm:max-w-none">{student.email || student.contactInfo.email}</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-1.5 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${student.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}>
                    {student.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                  <div className="flex space-x-1 sm:space-x-2">
                    {student.batch && (
                      <Link
                        to={`/batches/${student.batch._id}/students/${student._id}/edit`}
                        className="text-cadd-red hover:text-cadd-pink transition-colors duration-200"
                      >
                        <PencilIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Link>
                    )}
                    <button className="text-blue-600 hover:text-blue-900 transition-colors duration-200">
                      <EyeIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )}
</div>
  )
}

export default TeacherStudentsList
