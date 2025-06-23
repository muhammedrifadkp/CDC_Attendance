import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { studentsAPI } from '../../../services/api'
import {
  UserIcon,
  ArrowLeftIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  XCircleIcon,
  CurrencyRupeeIcon,
  PencilIcon,
  TrashIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { showConfirm } from '../../../utils/popup'
import { formatDateLong, formatDateSimple } from '../../../utils/dateUtils'
import BackButton from '../../../components/BackButton'

const StudentDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [student, setStudent] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    fetchStudentData()
  }, [id])

  const fetchStudentData = async () => {
    try {
      setLoading(true)
      const res = await studentsAPI.getStudentById(id)
      setStudent(res.data)

      // Calculate basic stats (this would be enhanced with actual attendance data)
      const basicStats = {
        totalClasses: 0,
        attendedClasses: 0,
        attendancePercentage: 0,
        totalFees: res.data.totalFees || 0,
        paidFees: res.data.feesPaid || 0,
        pendingFees: (res.data.totalFees || 0) - (res.data.feesPaid || 0)
      }

      setStats(basicStats)
    } catch (error) {
      console.error('Error fetching student data:', error)
      toast.error('Failed to fetch student details')
      navigate('/admin/students')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setActionLoading(true)
      await studentsAPI.deleteStudent(id)
      toast.success('Student deleted successfully')
      navigate('/admin/students')
    } catch (error) {
      console.error('Error deleting student:', error)
      toast.error(error.response?.data?.message || 'Failed to delete student')
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cadd-red"></div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Student Not Found</h2>
          <Link to="/admin/students" className="text-cadd-red hover:text-cadd-pink">
            Back to Students
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-6">
  <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
    {/* Header - Stacked on mobile */}
    <div className="mb-6 md:mb-8">
      <BackButton className="text-sm md:text-base" />
      <div className="mt-3 md:mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{student.name}</h1>
          <p className="mt-1 md:mt-2 text-sm md:text-base text-gray-600">Student profile and information</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
          <Link
            to={`/admin/students/${id}/edit`}
            className="inline-flex items-center justify-center px-3 py-1.5 md:px-4 md:py-2 border border-transparent rounded-lg shadow-sm text-xs md:text-sm font-medium text-white bg-cadd-red hover:bg-cadd-pink focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-colors"
          >
            <PencilIcon className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            Edit Student
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center justify-center px-3 py-1.5 md:px-4 md:py-2 border border-transparent rounded-lg shadow-sm text-xs md:text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            <TrashIcon className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            Delete
          </button>
        </div>
      </div>
    </div>

    {/* Student Information Card - Adjusted for mobile */}
    <div className="bg-white shadow-md md:shadow-lg rounded-xl md:rounded-2xl overflow-hidden mb-6 md:mb-8">
      <div className="bg-gradient-to-r from-cadd-red to-cadd-pink px-4 py-6 md:px-6 md:py-8">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 rounded-full flex items-center justify-center">
            <UserIcon className="h-8 w-8 md:h-10 md:w-10 text-white" />
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-xl md:text-2xl font-bold text-white">{student.name}</h2>
            <p className="text-white/80 text-base md:text-lg">Roll: {student.rollNo || student.rollNumber || 'N/A'}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
              {student.department && (
                <span className="inline-flex items-center px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs font-medium bg-white/20 text-white">
                  <BuildingOfficeIcon className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                  {student.department.name || student.department}
                </span>
              )}
              {student.isActive ? (
                <span className="inline-flex items-center px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircleIcon className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <XCircleIcon className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                  Inactive
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 md:px-6 md:py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Personal Information */}
          <div>
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Personal Information</h3>
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center">
                <EnvelopeIcon className="h-4 w-4 md:h-5 md:w-5 text-gray-400 mr-2 md:mr-3" />
                <div>
                  <p className="text-xs md:text-sm text-gray-500">Email</p>
                  <p className="text-sm md:text-base text-gray-900 font-medium">{student.email}</p>
                </div>
              </div>
              {student.phone && (
                <div className="flex items-center">
                  <PhoneIcon className="h-4 w-4 md:h-5 md:w-5 text-gray-400 mr-2 md:mr-3" />
                  <div>
                    <p className="text-xs md:text-sm text-gray-500">Phone</p>
                    <p className="text-sm md:text-base text-gray-900 font-medium">{student.phone}</p>
                  </div>
                </div>
              )}
              {student.address && (
                <div className="flex items-center">
                  <MapPinIcon className="h-4 w-4 md:h-5 md:w-5 text-gray-400 mr-2 md:mr-3" />
                  <div>
                    <p className="text-xs md:text-sm text-gray-500">Address</p>
                    <p className="text-sm md:text-base text-gray-900 font-medium">{student.address}</p>
                  </div>
                </div>
              )}
              {(student.dateOfBirth || student.dob) && (
                <div className="flex items-center">
                  <CalendarDaysIcon className="h-4 w-4 md:h-5 md:w-5 text-gray-400 mr-2 md:mr-3" />
                  <div>
                    <p className="text-xs md:text-sm text-gray-500">Date of Birth</p>
                    <p className="text-sm md:text-base text-gray-900 font-medium">{formatDate(student.dateOfBirth || student.dob)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Academic Information */}
          <div>
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Academic Information</h3>
            <div className="space-y-3 md:space-y-4">
              {student.course && (
                <div className="flex items-center">
                  <AcademicCapIcon className="h-4 w-4 md:h-5 md:w-5 text-gray-400 mr-2 md:mr-3" />
                  <div>
                    <p className="text-xs md:text-sm text-gray-500">Course</p>
                    <p className="text-sm md:text-base text-gray-900 font-medium">{student.course.name || student.course}</p>
                  </div>
                </div>
              )}
              {student.batch && (
                <div className="flex items-center">
                  <UserGroupIcon className="h-4 w-4 md:h-5 md:w-5 text-gray-400 mr-2 md:mr-3" />
                  <div>
                    <p className="text-xs md:text-sm text-gray-500">Batch</p>
                    <p className="text-sm md:text-base text-gray-900 font-medium">{student.batch.name || student.batch}</p>
                  </div>
                </div>
              )}
              {(student.admissionDate || student.createdAt) && (
                <div className="flex items-center">
                  <CalendarDaysIcon className="h-4 w-4 md:h-5 md:w-5 text-gray-400 mr-2 md:mr-3" />
                  <div>
                    <p className="text-xs md:text-sm text-gray-500">Admission Date</p>
                    <p className="text-sm md:text-base text-gray-900 font-medium">{formatDate(student.admissionDate || student.createdAt)}</p>
                  </div>
                </div>
              )}
              {student.academicYear && (
                <div className="flex items-center">
                  <DocumentTextIcon className="h-4 w-4 md:h-5 md:w-5 text-gray-400 mr-2 md:mr-3" />
                  <div>
                    <p className="text-xs md:text-sm text-gray-500">Academic Year</p>
                    <p className="text-sm md:text-base text-gray-900 font-medium">{student.academicYear}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fee Information */}
          <div>
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Fee Information</h3>
            <div className="space-y-3 md:space-y-4">
              {stats && (
                <>
                  <div className="flex items-center">
                    <CurrencyRupeeIcon className="h-4 w-4 md:h-5 md:w-5 text-gray-400 mr-2 md:mr-3" />
                    <div>
                      <p className="text-xs md:text-sm text-gray-500">Total Fees</p>
                      <p className="text-sm md:text-base text-gray-900 font-medium">{formatCurrency(stats.totalFees)}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <CurrencyRupeeIcon className="h-4 w-4 md:h-5 md:w-5 text-gray-400 mr-2 md:mr-3" />
                    <div>
                      <p className="text-xs md:text-sm text-gray-500">Paid Fees</p>
                      <p className="text-sm md:text-base text-gray-900 font-medium">{formatCurrency(stats.paidFees)}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <CurrencyRupeeIcon className="h-4 w-4 md:h-5 md:w-5 text-gray-400 mr-2 md:mr-3" />
                    <div>
                      <p className="text-xs md:text-sm text-gray-500">Pending Fees</p>
                      <p className="text-sm md:text-base text-gray-900 font-medium">{formatCurrency(stats.pendingFees)}</p>
                    </div>
                  </div>
                </>
              )}
              {student.paymentStatus && (
                <div className="flex items-center">
                  <CheckCircleIcon className="h-4 w-4 md:h-5 md:w-5 text-gray-400 mr-2 md:mr-3" />
                  <div>
                    <p className="text-xs md:text-sm text-gray-500">Payment Status</p>
                    <span className={`inline-flex items-center px-1.5 py-0.5 md:px-2 md:py-1 rounded-full text-xs font-medium ${
                      student.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                      student.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                      student.paymentStatus === 'overdue' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {student.paymentStatus}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Guardian Information */}
    {(student.guardianName || student.guardianPhone || student.emergencyContact) && (
      <div className="bg-white shadow-md md:shadow-lg rounded-xl md:rounded-2xl overflow-hidden mb-6 md:mb-8">
        <div className="px-4 py-3 md:px-6 md:py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-base md:text-lg font-semibold text-gray-900">Guardian & Emergency Contact</h3>
        </div>
        <div className="px-4 py-4 md:px-6 md:py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {student.guardianName && (
              <div className="flex items-center">
                <UserIcon className="h-4 w-4 md:h-5 md:w-5 text-gray-400 mr-2 md:mr-3" />
                <div>
                  <p className="text-xs md:text-sm text-gray-500">Guardian Name</p>
                  <p className="text-sm md:text-base text-gray-900 font-medium">{student.guardianName}</p>
                </div>
              </div>
            )}
            {student.guardianPhone && (
              <div className="flex items-center">
                <PhoneIcon className="h-4 w-4 md:h-5 md:w-5 text-gray-400 mr-2 md:mr-3" />
                <div>
                  <p className="text-xs md:text-sm text-gray-500">Guardian Phone</p>
                  <p className="text-sm md:text-base text-gray-900 font-medium">{student.guardianPhone}</p>
                </div>
              </div>
            )}
            {student.emergencyContact && (
              <div className="flex items-center">
                <PhoneIcon className="h-4 w-4 md:h-5 md:w-5 text-gray-400 mr-2 md:mr-3" />
                <div>
                  <p className="text-xs md:text-sm text-gray-500">Emergency Contact</p>
                  <p className="text-sm md:text-base text-gray-900 font-medium">{student.emergencyContact}</p>
                </div>
              </div>
            )}
            {student.qualification && (
              <div className="flex items-center">
                <DocumentTextIcon className="h-4 w-4 md:h-5 md:w-5 text-gray-400 mr-2 md:mr-3" />
                <div>
                  <p className="text-xs md:text-sm text-gray-500">Qualification</p>
                  <p className="text-sm md:text-base text-gray-900 font-medium">{student.qualification}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    {/* Quick Actions - Stacked on mobile */}
    <div className="bg-white shadow-md md:shadow-lg rounded-xl md:rounded-2xl p-4 md:p-6">
      <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4 md:mb-6">Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Link
          to={`/admin/students/${id}/edit`}
          className="inline-flex items-center justify-center px-4 py-2 md:px-6 md:py-3 border border-transparent text-xs md:text-sm font-semibold rounded-lg md:rounded-xl text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow hover:shadow-md md:hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] md:hover:scale-105"
        >
          <PencilIcon className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
          Edit Profile
        </Link>
        <Link
          to={`/admin/attendance?student=${id}`}
          className="inline-flex items-center justify-center px-4 py-2 md:px-6 md:py-3 border border-transparent text-xs md:text-sm font-semibold rounded-lg md:rounded-xl text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow hover:shadow-md md:hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] md:hover:scale-105"
        >
          <ClipboardDocumentCheckIcon className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
          View Attendance
        </Link>
        <Link
          to={`/admin/analytics?student=${id}`}
          className="inline-flex items-center justify-center px-4 py-2 md:px-6 md:py-3 border border-transparent text-xs md:text-sm font-semibold rounded-lg md:rounded-xl text-white bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 shadow hover:shadow-md md:hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] md:hover:scale-105"
        >
          <ChartBarIcon className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
          Analytics
        </Link>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="inline-flex items-center justify-center px-4 py-2 md:px-6 md:py-3 border border-transparent text-xs md:text-sm font-semibold rounded-lg md:rounded-xl text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow hover:shadow-md md:hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] md:hover:scale-105"
        >
          <TrashIcon className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
          Delete Student
        </button>
      </div>
    </div>

    {/* Delete Confirmation Modal - Responsive */}
    {showDeleteModal && (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-xs sm:max-w-md w-full p-4 md:p-5">
          <div className="mt-3 text-center">
            <div className="mx-auto flex items-center justify-center h-10 w-10 md:h-12 md:w-12 rounded-full bg-red-100">
              <TrashIcon className="h-5 w-5 md:h-6 md:w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mt-3 md:mt-4">Delete Student</h3>
            <div className="mt-2 px-2 md:px-7 py-1 md:py-3">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete {student.name}? This action cannot be undone and will remove all associated data.
              </p>
            </div>
            <div className="items-center px-2 md:px-4 py-2 md:py-3">
              <div className="flex gap-2 md:gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-3 py-1.5 md:px-4 md:py-2 bg-gray-500 text-white text-sm md:text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-3 py-1.5 md:px-4 md:py-2 bg-red-600 text-white text-sm md:text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
</div>
  )
}

export default StudentDetails