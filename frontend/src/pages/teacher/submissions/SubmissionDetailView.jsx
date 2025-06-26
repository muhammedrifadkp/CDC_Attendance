import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  PencilIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserIcon,
  CalendarIcon,
  DocumentTextIcon,
  InformationCircleIcon,
  StarIcon,
  TrophyIcon
} from '@heroicons/react/24/outline'
import { format, formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { projectAPI } from '../../../services/api'

const SubmissionDetailView = () => {
  const { submissionId } = useParams()
  const navigate = useNavigate()
  
  const [submission, setSubmission] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (submissionId) {
      fetchSubmissionDetails()
    }
  }, [submissionId])

  const fetchSubmissionDetails = async () => {
    try {
      setLoading(true)
      const response = await projectAPI.getSubmissionDetails(submissionId)
      setSubmission(response.data)
    } catch (error) {
      console.error('Error fetching submission:', error)
      toast.error('Failed to fetch submission details')
      navigate(-1)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (newStatus) => {
    try {
      setUpdating(true)
      await projectAPI.updateSubmissionStatus(submissionId, { status: newStatus })
      setSubmission(prev => ({ ...prev, status: newStatus }))
      toast.success(`Submission marked as ${newStatus.replace('_', ' ')}`)
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update submission status')
    } finally {
      setUpdating(false)
    }
  }

  const downloadFile = async (file) => {
    try {
      const response = await projectAPI.downloadSubmissionFile(submissionId, file.fileName)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', file.originalName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('File downloaded successfully')
    } catch (error) {
      console.error('Error downloading file:', error)
      toast.error('Failed to download file')
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      submitted: { color: 'bg-blue-100 text-blue-800', text: 'New Submission', icon: DocumentTextIcon },
      under_review: { color: 'bg-yellow-100 text-yellow-800', text: 'Under Review', icon: ClockIcon },
      graded: { color: 'bg-green-100 text-green-800', text: 'Graded', icon: CheckCircleIcon },
      returned: { color: 'bg-orange-100 text-orange-800', text: 'Returned', icon: ExclamationTriangleIcon }
    }
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', text: status, icon: DocumentTextIcon }
    const IconComponent = config.icon
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <IconComponent className="h-4 w-4 mr-2" />
        {config.text}
      </span>
    )
  }

  const getTimingBadge = (timing) => {
    const timingConfig = {
      early: { color: 'bg-green-100 text-green-800', text: 'Early Submission' },
      on_time: { color: 'bg-blue-100 text-blue-800', text: 'On Time' },
      late: { color: 'bg-red-100 text-red-800', text: 'Late Submission' }
    }
    
    const config = timingConfig[timing] || { color: 'bg-gray-100 text-gray-800', text: timing }
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.text}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Submission not found</h3>
        <p className="mt-1 text-sm text-gray-500">The submission you're looking for doesn't exist.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Submission Details</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {submission.project.title} - {submission.student.name}
            </p>
          </div>
          <div className="flex space-x-2">
            {getStatusBadge(submission.status)}
            {getTimingBadge(submission.submissionTiming)}
          </div>
        </div>

        {/* Student & Project Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <UserIcon className="h-4 w-4 mr-2" />
              Student Information
            </h3>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Name:</span> {submission.student.name}</div>
              <div><span className="font-medium">Roll No:</span> {submission.student.rollNo}</div>
              <div><span className="font-medium">Student ID:</span> {submission.student.studentId}</div>
              <div><span className="font-medium">Email:</span> {submission.student.email}</div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              Project Information
            </h3>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Title:</span> {submission.project.title}</div>
              <div><span className="font-medium">Deadline:</span> {format(new Date(submission.project.deadlineDate), 'MMM dd, yyyy')}</div>
              <div><span className="font-medium">Max Score:</span> {submission.project.maxScore} points</div>
              <div><span className="font-medium">Batch:</span> {submission.project.batch?.name}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Submission Details */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Submission Details</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-900">Submitted On</p>
                <p className="text-lg font-bold text-blue-600">
                  {format(new Date(submission.submittedDate), 'MMM dd, yyyy')}
                </p>
                <p className="text-xs text-blue-700">
                  {formatDistanceToNow(new Date(submission.submittedDate), { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-900">Days from Deadline</p>
                <p className="text-lg font-bold text-purple-600">
                  {submission.daysFromDeadline > 0 ? '+' : ''}{submission.daysFromDeadline}
                </p>
                <p className="text-xs text-purple-700">
                  {submission.timingAnalysis}
                </p>
              </div>
            </div>
          </div>

          {submission.attendanceScore !== null && (
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <TrophyIcon className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-900">Attendance Score</p>
                  <p className="text-lg font-bold text-green-600">
                    {submission.attendanceScore}%
                  </p>
                  <p className="text-xs text-green-700">
                    Based on class attendance
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Description & Notes */}
        {submission.description && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Description</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{submission.description}</p>
            </div>
          </div>
        )}

        {submission.notes && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Student Notes</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{submission.notes}</p>
            </div>
          </div>
        )}
      </div>

      {/* Files Section */}
      {submission.files && submission.files.length > 0 && (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Submitted Files</h2>
          <div className="space-y-3">
            {submission.files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <DocumentArrowDownIcon className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.originalName}</p>
                    <p className="text-xs text-gray-500">
                      {(file.fileSize / (1024 * 1024)).toFixed(2)} MB •
                      Uploaded {format(new Date(file.uploadedAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => downloadFile(file)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
                >
                  <DocumentArrowDownIcon className="h-3 w-3 mr-1" />
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grading Section */}
      {submission.status === 'graded' && (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Grading Information</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <StarIcon className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-900">Project Score</p>
                  <p className="text-2xl font-bold text-green-600">{submission.score}/100</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <TrophyIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-900">Final Score</p>
                  <p className="text-2xl font-bold text-blue-600">{submission.finalScore}/100</p>
                </div>
              </div>
            </div>

            {submission.rank && (
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center">
                  <TrophyIcon className="h-8 w-8 text-yellow-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-yellow-900">Rank</p>
                    <p className="text-2xl font-bold text-yellow-600">#{submission.rank}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {submission.feedback && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Teacher Feedback</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{submission.feedback}</p>
              </div>
              {submission.gradedBy && (
                <p className="text-xs text-gray-500 mt-2">
                  Graded by {submission.gradedBy.name} on {format(new Date(submission.gradedDate), 'MMM dd, yyyy HH:mm')}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          {submission.status === 'submitted' && (
            <button
              onClick={() => updateStatus('under_review')}
              disabled={updating}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
            >
              <ClockIcon className="h-4 w-4 mr-2" />
              Mark as Under Review
            </button>
          )}

          {(submission.status === 'submitted' || submission.status === 'under_review') && (
            <Link
              to={`/projects/${submission.project._id}/submissions/${submission._id}/grade`}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Grade Submission
            </Link>
          )}

          {submission.status === 'graded' && (
            <button
              onClick={() => updateStatus('returned')}
              disabled={updating}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
              Return for Revision
            </button>
          )}

          <Link
            to={`/projects/${submission.project._id}/submissions`}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            View All Submissions
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SubmissionDetailView
