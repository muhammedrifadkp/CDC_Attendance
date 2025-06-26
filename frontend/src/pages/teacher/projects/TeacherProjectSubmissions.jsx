import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  DocumentArrowDownIcon,
  EyeIcon,
  PencilIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  TrophyIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { projectAPI } from '../../../services/api'

const TeacherProjectSubmissions = () => {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    status: '',
    sortBy: 'submittedDate',
    order: 'desc'
  })
  const [gradingSubmission, setGradingSubmission] = useState(null)
  const [gradeForm, setGradeForm] = useState({
    score: '',
    feedback: ''
  })

  useEffect(() => {
    fetchProjectAndSubmissions()
  }, [id, filter])

  const fetchProjectAndSubmissions = async () => {
    try {
      setLoading(true)
      const [projectResponse, submissionsResponse] = await Promise.all([
        projectAPI.getProject(id),
        projectAPI.getProjectSubmissions(id, filter)
      ])
      setProject(projectResponse.data)
      setSubmissions(submissionsResponse.data)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to fetch project data')
    } finally {
      setLoading(false)
    }
  }

  const handleGradeSubmission = async (submissionId) => {
    if (!gradeForm.score || gradeForm.score < 0 || gradeForm.score > project.maxScore) {
      toast.error(`Score must be between 0 and ${project.maxScore}`)
      return
    }

    try {
      await projectAPI.gradeSubmission(submissionId, gradeForm)
      toast.success('Submission graded successfully')
      setGradingSubmission(null)
      setGradeForm({ score: '', feedback: '' })
      fetchProjectAndSubmissions()
    } catch (error) {
      console.error('Error grading submission:', error)
      toast.error('Failed to grade submission')
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      submitted: { color: 'bg-blue-100 text-blue-800', text: 'Submitted' },
      under_review: { color: 'bg-yellow-100 text-yellow-800', text: 'Under Review' },
      graded: { color: 'bg-green-100 text-green-800', text: 'Graded' },
      returned: { color: 'bg-orange-100 text-orange-800', text: 'Returned' },
      resubmitted: { color: 'bg-purple-100 text-purple-800', text: 'Resubmitted' }
    }

    const config = statusConfig[status] || statusConfig.submitted

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    )
  }

  const getTimingIcon = (timing) => {
    switch (timing) {
      case 'early':
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />
      case 'on_time':
        return <ClockIcon className="h-4 w-4 text-blue-600" />
      case 'late':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
      default:
        return <ClockIcon className="h-4 w-4 text-gray-600" />
    }
  }

  const getGradeColor = (score, maxScore) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 80) return 'text-blue-600'
    if (percentage >= 70) return 'text-yellow-600'
    if (percentage >= 60) return 'text-orange-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Project not found</h3>
        <p className="mt-1 text-sm text-gray-500">The project you're looking for doesn't exist.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-start lg:justify-between lg:space-y-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{project.title}</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">{project.batch?.name} - {project.course?.name}</p>
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-2 space-y-1 sm:space-y-0 text-xs sm:text-sm text-gray-600">
              <span>Deadline: {format(new Date(project.deadlineDate), 'MMM dd, yyyy')}</span>
              <span>Max Score: {project.maxScore}</span>
              <span>Submissions: {submissions.length}</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 flex-shrink-0">
            <Link
              to={`../projects/${project._id}/analytics`}
              className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 w-full sm:w-auto"
            >
              <TrophyIcon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">View Analytics</span>
              <span className="sm:hidden">Analytics</span>
            </Link>
            <Link
              to={`../projects/${project._id}/edit`}
              className="inline-flex items-center justify-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 w-full sm:w-auto"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Edit Project</span>
              <span className="sm:hidden">Edit</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="graded">Graded</option>
              <option value="returned">Returned</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={filter.sortBy}
              onChange={(e) => setFilter({ ...filter, sortBy: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="submittedDate">Submission Date</option>
              <option value="finalScore">Final Score</option>
              <option value="student">Student Name</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order
            </label>
            <select
              value={filter.order}
              onChange={(e) => setFilter({ ...filter, order: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      {submissions.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <DocumentArrowDownIcon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
          <h3 className="mt-2 text-sm sm:text-base font-medium text-gray-900">No submissions found</h3>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 max-w-sm mx-auto">
            No students have submitted this project yet.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Final Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {submissions.map((submission) => (
                  <tr key={submission._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {submission.student?.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {submission.student?.rollNo} | {submission.student?.studentId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(submission.submittedDate), 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getTimingIcon(submission.submissionTiming)}
                        <span className="ml-2 text-sm text-gray-900 capitalize">
                          {submission.submissionTiming.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {submission.score !== null ? (
                        <span className={`font-medium ${getGradeColor(submission.score, project.maxScore)}`}>
                          {submission.score}/{project.maxScore}
                        </span>
                      ) : (
                        <span className="text-gray-400">Not graded</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {submission.finalScore !== null ? (
                        <div className="flex items-center">
                          <span className={`font-medium ${getGradeColor(submission.finalScore, 100)}`}>
                            {submission.finalScore.toFixed(1)}
                          </span>
                          {submission.rank && (
                            <span className="ml-2 text-xs text-gray-500">
                              (Rank #{submission.rank})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">Not calculated</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(submission.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setGradingSubmission(submission._id)
                            setGradeForm({
                              score: submission.score || '',
                              feedback: submission.feedback || ''
                            })
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          {submission.score !== null ? 'Edit Grade' : 'Grade'}
                        </button>
                        <button className="text-blue-600 hover:text-blue-900">
                          <EyeIcon className="h-4 w-4" />
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

      {/* Grading Modal */}
      {gradingSubmission && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Grade Submission</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Score (out of {project.maxScore})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={project.maxScore}
                    value={gradeForm.score}
                    onChange={(e) => setGradeForm({ ...gradeForm, score: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Enter score"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Feedback
                  </label>
                  <textarea
                    value={gradeForm.feedback}
                    onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Enter feedback for the student"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setGradingSubmission(null)
                    setGradeForm({ score: '', feedback: '' })
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleGradeSubmission(gradingSubmission)}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                >
                  Save Grade
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeacherProjectSubmissions
