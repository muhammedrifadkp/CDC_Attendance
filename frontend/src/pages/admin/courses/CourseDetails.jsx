import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { coursesAPI, batchesAPI } from '../../../services/api'
import {
  AcademicCapIcon,
  BuildingOfficeIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  UserIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  UserGroupIcon,
  StarIcon,
  TagIcon,
  ComputerDesktopIcon,
  BookOpenIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import BackButton from '../../../components/BackButton'

const CourseDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [stats, setStats] = useState(null)
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    fetchCourseData()
  }, [id])

  const fetchCourseData = async () => {
    try {
      setLoading(true)
      const [courseResponse, batchesResponse] = await Promise.all([
        coursesAPI.getCourseById(id),
        batchesAPI.getBatchesByCourse(id)
      ])

      setCourse(courseResponse.data)
      setBatches(batchesResponse.data.batches || [])

      // Calculate basic stats
      const courseStats = {
        totalBatches: batchesResponse.data.batches?.length || 0,
        activeBatches: batchesResponse.data.batches?.filter(b => !b.isFinished).length || 0,
        totalStudents: batchesResponse.data.batches?.reduce((sum, batch) => sum + (batch.students?.length || 0), 0) || 0,
        averageBatchSize: 0
      }

      if (courseStats.totalBatches > 0) {
        courseStats.averageBatchSize = Math.round(courseStats.totalStudents / courseStats.totalBatches)
      }

      setStats(courseStats)
    } catch (error) {
      console.error('Error fetching course data:', error)
      toast.error('Failed to fetch course details')
      navigate('/admin/courses')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setActionLoading(true)
      await coursesAPI.deleteCourse(id)
      toast.success('Course deleted successfully')
      navigate('/admin/courses')
    } catch (error) {
      console.error('Error deleting course:', error)
      toast.error(error.response?.data?.message || 'Failed to delete course')
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

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h2>
          <Link to="/admin/courses" className="text-cadd-red hover:text-cadd-pink">
            Back to Courses
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{course.name}</h1>
          <p className="mt-1 md:mt-2 text-sm md:text-base text-gray-600">Course overview and management</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
          <Link
            to={`/admin/courses/${id}/edit`}
            className="inline-flex items-center justify-center px-3 py-1.5 md:px-4 md:py-2 border border-transparent rounded-lg shadow-sm text-xs md:text-sm font-medium text-white bg-cadd-red hover:bg-cadd-pink focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-colors"
          >
            <PencilIcon className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            Edit Course
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

    {/* Course Information Card - Adjusted for mobile */}
    <div className="bg-white shadow-md md:shadow-lg rounded-xl md:rounded-2xl overflow-hidden mb-6 md:mb-8">
      <div className="bg-gradient-to-r from-cadd-red to-cadd-pink px-4 py-6 md:px-6 md:py-8">
        <div className="flex flex-col sm:flex-row items-center">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 rounded-full flex items-center justify-center">
            <AcademicCapIcon className="h-8 w-8 md:h-10 md:w-10 text-white" />
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-4 md:ml-6 text-center sm:text-left">
            <h2 className="text-xl md:text-2xl font-bold text-white">{course.name}</h2>
            <p className="text-white/80 text-base md:text-lg">{course.code}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
              <span className="inline-flex items-center px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs font-medium bg-white/20 text-white">
                <BuildingOfficeIcon className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                {course.department?.name}
              </span>
              {course.isActive ? (
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
          {/* Basic Information */}
          <div>
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Basic Information</h3>
            <div className="space-y-3 md:space-y-4">
              {course.description && (
                <div>
                  <p className="text-xs md:text-sm text-gray-500">Description</p>
                  <p className="text-sm md:text-base text-gray-900">{course.description}</p>
                </div>
              )}
              <div className="flex items-center">
                <StarIcon className="h-4 w-4 md:h-5 md:w-5 text-gray-400 mr-2 md:mr-3" />
                <div>
                  <p className="text-xs md:text-sm text-gray-500">Level</p>
                  <p className="text-sm md:text-base text-gray-900 font-medium">{course.level}</p>
                </div>
              </div>
              <div className="flex items-center">
                <TagIcon className="h-4 w-4 md:h-5 md:w-5 text-gray-400 mr-2 md:mr-3" />
                <div>
                  <p className="text-xs md:text-sm text-gray-500">Category</p>
                  <p className="text-sm md:text-base text-gray-900 font-medium">{course.category}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Duration & Fees */}
          <div>
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Duration & Fees</h3>
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 md:h-5 md:w-5 text-gray-400 mr-2 md:mr-3" />
                <div>
                  <p className="text-xs md:text-sm text-gray-500">Duration</p>
                  <p className="text-sm md:text-base text-gray-900 font-medium">
                    {course.duration?.months} months
                    {course.duration?.hours && ` (${course.duration.hours} hours)`}
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <CurrencyRupeeIcon className="h-4 w-4 md:h-5 md:w-5 text-gray-400 mr-2 md:mr-3" />
                <div>
                  <p className="text-xs md:text-sm text-gray-500">Course Fees</p>
                  <p className="text-sm md:text-base text-gray-900 font-medium">{formatCurrency(course.fees?.amount || 0)}</p>
                </div>
              </div>
              {course.fees?.installments?.allowed && (
                <div className="flex items-center">
                  <CurrencyRupeeIcon className="h-4 w-4 md:h-5 md:w-5 text-gray-400 mr-2 md:mr-3" />
                  <div>
                    <p className="text-xs md:text-sm text-gray-500">Installments</p>
                    <p className="text-sm md:text-base text-gray-900 font-medium">
                      {course.fees.installments.numberOfInstallments} installments allowed
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Class Information */}
          <div>
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Class Information</h3>
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center">
                <UserGroupIcon className="h-4 w-4 md:h-5 md:w-5 text-gray-400 mr-2 md:mr-3" />
                <div>
                  <p className="text-xs md:text-sm text-gray-500">Max Students per Batch</p>
                  <p className="text-sm md:text-base text-gray-900 font-medium">{course.maxStudentsPerBatch}</p>
                </div>
              </div>
              <div className="flex items-center">
                <CalendarDaysIcon className="h-4 w-4 md:h-5 md:w-5 text-gray-400 mr-2 md:mr-3" />
                <div>
                  <p className="text-xs md:text-sm text-gray-500">Created</p>
                  <p className="text-sm md:text-base text-gray-900 font-medium">{formatDate(course.createdAt)}</p>
                </div>
              </div>
              {course.certification?.provided && (
                <div className="flex items-center">
                  <DocumentTextIcon className="h-4 w-4 md:h-5 md:w-5 text-gray-400 mr-2 md:mr-3" />
                  <div>
                    <p className="text-xs md:text-sm text-gray-500">Certification</p>
                    <p className="text-sm md:text-base text-gray-900 font-medium">
                      {course.certification.certificateName || 'Certificate Provided'}
                    </p>
                    {course.certification.issuingAuthority && (
                      <p className="text-xs text-gray-600">by {course.certification.issuingAuthority}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Statistics Cards - Stacked on mobile */}
    {stats && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="bg-white rounded-xl md:rounded-2xl shadow-md md:shadow-lg p-4 md:p-6">
          <div className="flex items-center">
            <div className="p-2 md:p-3 bg-blue-100 rounded-lg">
              <UserGroupIcon className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
            </div>
            <div className="ml-3 md:ml-4">
              <p className="text-xs md:text-sm text-gray-500">Total Batches</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.totalBatches}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl md:rounded-2xl shadow-md md:shadow-lg p-4 md:p-6">
          <div className="flex items-center">
            <div className="p-2 md:p-3 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
            </div>
            <div className="ml-3 md:ml-4">
              <p className="text-xs md:text-sm text-gray-500">Active Batches</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.activeBatches}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl md:rounded-2xl shadow-md md:shadow-lg p-4 md:p-6">
          <div className="flex items-center">
            <div className="p-2 md:p-3 bg-yellow-100 rounded-lg">
              <UserIcon className="h-5 w-5 md:h-6 md:w-6 text-yellow-600" />
            </div>
            <div className="ml-3 md:ml-4">
              <p className="text-xs md:text-sm text-gray-500">Total Students</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl md:rounded-2xl shadow-md md:shadow-lg p-4 md:p-6">
          <div className="flex items-center">
            <div className="p-2 md:p-3 bg-purple-100 rounded-lg">
              <ChartBarIcon className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
            </div>
            <div className="ml-3 md:ml-4">
              <p className="text-xs md:text-sm text-gray-500">Avg Batch Size</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.averageBatchSize}</p>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Course Details Sections - Stacked on mobile */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
      {/* Prerequisites */}
      {course.prerequisites && course.prerequisites.length > 0 && (
        <div className="bg-white shadow-md md:shadow-lg rounded-xl md:rounded-2xl overflow-hidden">
          <div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-200">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 flex items-center">
              <BookOpenIcon className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
              Prerequisites
            </h3>
          </div>
          <div className="px-4 py-4 md:px-6 md:py-6">
            <ul className="space-y-1 md:space-y-2">
              {course.prerequisites.map((prereq, index) => (
                <li key={index} className="flex items-center text-sm md:text-base text-gray-700">
                  <CheckCircleIcon className="h-3 w-3 md:h-4 md:w-4 text-green-500 mr-1 md:mr-2 flex-shrink-0" />
                  {prereq}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Software Requirements */}
      {course.software && course.software.length > 0 && (
        <div className="bg-white shadow-md md:shadow-lg rounded-xl md:rounded-2xl overflow-hidden">
          <div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-200">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 flex items-center">
              <ComputerDesktopIcon className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
              Software Requirements
            </h3>
          </div>
          <div className="px-4 py-4 md:px-6 md:py-6">
            <div className="space-y-2 md:space-y-3">
              {course.software.map((software, index) => (
                <div key={index} className="flex items-center justify-between p-2 md:p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm md:text-base font-medium text-gray-900">{software.name}</p>
                    {software.version && (
                      <p className="text-xs md:text-sm text-gray-600">Version: {software.version}</p>
                    )}
                  </div>
                  <span className={`px-1.5 py-0.5 md:px-2 md:py-1 text-xs font-medium rounded-full ${
                    software.required
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {software.required ? 'Required' : 'Optional'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Batches List */}
    <div className="bg-white shadow-md md:shadow-lg rounded-xl md:rounded-2xl overflow-hidden">
      <div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-base md:text-lg font-semibold text-gray-900">Course Batches</h3>
          <Link
            to={`/admin/batches/new?course=${id}`}
            className="inline-flex items-center justify-center px-3 py-1.5 md:px-4 md:py-2 border border-transparent rounded-lg shadow-sm text-xs md:text-sm font-medium text-white bg-cadd-red hover:bg-cadd-pink focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cadd-red transition-colors"
          >
            <UserGroupIcon className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            Add Batch
          </Link>
        </div>
      </div>

      <div className="px-4 py-4 md:px-6 md:py-6">
        {batches.length === 0 ? (
          <div className="text-center py-8 md:py-12">
            <UserGroupIcon className="mx-auto h-10 w-10 md:h-12 md:w-12 text-gray-400" />
            <h3 className="mt-2 text-sm md:text-base font-semibold text-gray-900">No batches found</h3>
            <p className="mt-1 text-xs md:text-sm text-gray-500">Get started by creating a new batch for this course.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {batches.map((batch) => (
              <div key={batch._id} className="border border-gray-200 rounded-lg p-3 md:p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2 md:mb-3">
                  <h4 className="text-base md:text-lg font-semibold text-gray-900">{batch.name}</h4>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    !batch.isFinished
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {!batch.isFinished ? 'Active' : 'Finished'}
                  </span>
                </div>
                <div className="space-y-1 md:space-y-2 text-xs md:text-sm text-gray-600">
                  <div className="flex items-center">
                    <CalendarDaysIcon className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                    <span>Section: {batch.section}</span>
                  </div>
                  <div className="flex items-center">
                    <UserGroupIcon className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                    <span>{batch.students?.length || 0} Students</span>
                  </div>
                  {batch.startDate && (
                    <div className="flex items-center">
                      <CalendarDaysIcon className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                      <span>Started: {formatDate(batch.startDate)}</span>
                    </div>
                  )}
                </div>
                <div className="mt-3 md:mt-4">
                  <Link
                    to={`/admin/batches/${batch._id}`}
                    className="text-cadd-red hover:text-cadd-pink text-xs md:text-sm font-medium"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    {/* Delete Confirmation Modal - Responsive */}
    {showDeleteModal && (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-xs sm:max-w-md w-full p-4 md:p-5">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-10 w-10 md:h-12 md:w-12 rounded-full bg-red-100">
              <TrashIcon className="h-5 w-5 md:h-6 md:w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mt-3 md:mt-4">Delete Course</h3>
            <div className="mt-2 px-2 md:px-7 py-1 md:py-3">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete <strong>{course.name}</strong>?
                This action cannot be undone and will affect all associated batches and student data.
              </p>
            </div>
            <div className="items-center px-2 md:px-4 py-2 md:py-3">
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-500 text-white text-sm md:text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50"
              >
                {actionLoading ? 'Deleting...' : 'Delete Course'}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="mt-2 md:mt-3 px-4 py-2 bg-white text-gray-500 text-sm md:text-base font-medium rounded-md w-full shadow-sm border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
</div>
  )
}

export default CourseDetails
