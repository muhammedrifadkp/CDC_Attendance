import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  DocumentArrowDownIcon,
  EyeIcon,
  PencilIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  TrophyIcon,
  CalendarIcon,
  UserIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  StarIcon,
  ChartBarIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { projectAPI, studentsAPI } from '../../../services/api'
import ProjectCompletionModal from '../../../components/projects/ProjectCompletionModal'

const ProjectSubmissionDetail = () => {
  const { id: projectId } = useParams()
  const navigate = useNavigate()
  
  const [project, setProject] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    status: '',
    sortBy: 'submittedDate',
    order: 'desc'
  })
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [showSubmissionModal, setShowSubmissionModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [submissionDate, setSubmissionDate] = useState('')

  useEffect(() => {
    if (projectId) {
      fetchProjectAndSubmissions()
    }
  }, [projectId, filter])

  const fetchProjectAndSubmissions = async () => {
    if (!projectId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const [projectResponse, submissionsResponse] = await Promise.all([
        projectAPI.getProject(projectId),
        projectAPI.getProjectSubmissions(projectId, filter)
      ])

      setProject(projectResponse.data)
      setSubmissions(submissionsResponse.data)

      // Fetch all students from the batch
      if (projectResponse.data.batch?._id) {
        const studentsResponse = await studentsAPI.getStudentsByBatch(projectResponse.data.batch._id)
        setStudents(studentsResponse.data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to fetch project details')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      submitted: { color: 'bg-blue-100 text-blue-800', text: 'Submitted' },
      graded: { color: 'bg-green-100 text-green-800', text: 'Graded' },
      returned: { color: 'bg-orange-100 text-orange-800', text: 'Returned' },
      late: { color: 'bg-red-100 text-red-800', text: 'Late' }
    }
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', text: status }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    )
  }

  const getTimingBadge = (timing) => {
    const timingConfig = {
      early: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, text: 'Early' },
      on_time: { color: 'bg-blue-100 text-blue-800', icon: ClockIcon, text: 'On Time' },
      late: { color: 'bg-red-100 text-red-800', icon: ExclamationTriangleIcon, text: 'Late' }
    }
    
    const config = timingConfig[timing] || { color: 'bg-gray-100 text-gray-800', icon: ClockIcon, text: timing }
    const IconComponent = config.icon
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.text}
      </span>
    )
  }

  const downloadFile = async (submission, file) => {
    try {
      const response = await projectAPI.downloadSubmissionFile(submission._id, file.fileName)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', file.originalName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading file:', error)
      toast.error('Failed to download file')
    }
  }

  const handleProjectCompletion = (completionData) => {
    setProject(prev => ({
      ...prev,
      status: 'completed',
      completedDate: completionData.project.completedDate,
      completedBy: completionData.project.completedBy
    }))
    // Refresh the data to get updated information
    fetchProjectAndSubmissions()
  }

  const handleSubmissionClick = (student) => {
    setSelectedStudent(student)
    setSubmissionDate(new Date().toISOString().split('T')[0]) // Default to today
    setShowSubmissionModal(true)
  }

  const handleSubmissionSubmit = async () => {
    if (!selectedStudent || !submissionDate) {
      toast.error('Please select a date for submission')
      return
    }

    try {
      // Create FormData for submission (backend expects FormData)
      const formData = new FormData()
      formData.append('studentId', selectedStudent._id)
      formData.append('description', 'Manual submission entry by admin')
      formData.append('notes', 'Submitted via admin interface')

      // Add custom submission date if different from today
      const selectedDate = new Date(submissionDate)
      const today = new Date()
      if (selectedDate.toDateString() !== today.toDateString()) {
        formData.append('customSubmissionDate', selectedDate.toISOString())
      }

      await projectAPI.submitProject(projectId, formData)

      toast.success('Submission recorded successfully')
      setShowSubmissionModal(false)
      setSelectedStudent(null)
      setSubmissionDate('')
      fetchProjectAndSubmissions() // Refresh data
    } catch (error) {
      console.error('Error recording submission:', error)
      toast.error(error.response?.data?.message || 'Failed to record submission')
    }
  }

  // Combine students with their submission status
  const getStudentSubmissionData = () => {
    return students.map(student => {
      const submission = submissions.find(sub => sub.student?._id === student._id)
      return {
        ...student,
        submission,
        hasSubmitted: !!submission
      }
    })
  }

  if (!projectId) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Invalid Project</h3>
        <p className="mt-1 text-sm text-gray-500">No project ID provided in the URL.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
        >
          Go Back
        </button>
      </div>
    )
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
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Project not found</h3>
        <p className="mt-1 text-sm text-gray-500">The project you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
        >
          Go Back
        </button>
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
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{project.title} - Submissions</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {project.batch?.name} - {project.course?.name}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <DocumentArrowDownIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-900">Total Submissions</p>
                <p className="text-2xl font-bold text-blue-600">{submissions.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-900">Graded</p>
                <p className="text-2xl font-bold text-green-600">
                  {submissions.filter(s => s.status === 'graded').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-orange-900">Pending</p>
                <p className="text-2xl font-bold text-orange-600">
                  {submissions.filter(s => s.status === 'submitted').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <TrophyIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-900">Avg Score</p>
                <p className="text-2xl font-bold text-purple-600">
                  {submissions.filter(s => s.finalScore).length > 0 
                    ? (submissions.reduce((sum, s) => sum + (s.finalScore || 0), 0) / 
                       submissions.filter(s => s.finalScore).length).toFixed(1)
                    : '0.0'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Link
            to={`../analytics`}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ChartBarIcon className="h-4 w-4 mr-2" />
            View Analytics
          </Link>
          <Link
            to={`../edit`}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit Project
          </Link>
          {project.status !== 'completed' && project.status !== 'archived' && (
            <button
              onClick={() => setShowCompletionModal(true)}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              <TrophyIcon className="h-4 w-4 mr-2" />
              Complete Project
            </button>
          )}
          {project.status === 'completed' && (
            <div className="inline-flex items-center px-4 py-2 border border-green-300 shadow-sm text-sm font-medium rounded-md text-green-700 bg-green-50">
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Project Completed
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="graded">Graded</option>
              <option value="returned">Returned</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={filter.sortBy}
              onChange={(e) => setFilter({ ...filter, sortBy: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
            >
              <option value="submittedDate">Submission Date</option>
              <option value="finalScore">Final Score</option>
              <option value="rank">Rank</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
            <select
              value={filter.order}
              onChange={(e) => setFilter({ ...filter, order: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students List */}
      {students.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <UserIcon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
          <h3 className="mt-2 text-sm sm:text-base font-medium text-gray-900">No students found</h3>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 max-w-sm mx-auto">
            No students are enrolled in this batch.
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
                    Submission Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getStudentSubmissionData().map((studentData) => (
                  <tr key={studentData._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {studentData.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {studentData.rollNo} • {studentData.studentId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {studentData.hasSubmitted ? (
                        getStatusBadge(studentData.submission.status)
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Not Submitted
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {studentData.hasSubmitted ? (
                        format(new Date(studentData.submission.submittedDate), 'MMM dd, yyyy HH:mm')
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {studentData.hasSubmitted ? (
                        getTimingBadge(studentData.submission.submissionTiming)
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {studentData.hasSubmitted && studentData.submission.finalScore ? (
                        <div className="flex items-center">
                          <span className="font-medium">{studentData.submission.finalScore}</span>
                          <span className="text-gray-500 ml-1">/ 100</span>
                          {studentData.submission.finalScore >= 90 && (
                            <StarIcon className="h-4 w-4 text-yellow-400 ml-2" />
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">Not graded</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {studentData.hasSubmitted && studentData.submission.rank ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          studentData.submission.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                          studentData.submission.rank <= 3 ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          #{studentData.submission.rank}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {studentData.hasSubmitted ? (
                        <>
                          <button
                            onClick={() => {/* View submission details */}}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          {studentData.submission.files && studentData.submission.files.length > 0 && (
                            <button
                              onClick={() => downloadFile(studentData.submission, studentData.submission.files[0])}
                              className="text-green-600 hover:text-green-900"
                              title="Download Files"
                            >
                              <DocumentArrowDownIcon className="h-4 w-4" />
                            </button>
                          )}
                          {studentData.submission.status === 'submitted' && (
                            <button
                              onClick={() => {/* Grade submission */}}
                              className="text-orange-600 hover:text-orange-900"
                              title="Grade Submission"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={() => handleSubmissionClick(studentData)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
                          title="Record Submission"
                        >
                          <PlusIcon className="h-3 w-3 mr-1" />
                          Submit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Project Completion Modal */}
      <ProjectCompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        projectId={projectId}
        onComplete={handleProjectCompletion}
      />

      {/* Submission Date Modal */}
      {showSubmissionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Record Submission</h3>
              <button
                onClick={() => setShowSubmissionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {selectedStudent && (
              <div className="mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-900">{selectedStudent.name}</p>
                  <p className="text-xs text-gray-500">{selectedStudent.rollNo} • {selectedStudent.studentId}</p>
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Submission Date *
              </label>
              <input
                type="date"
                value={submissionDate}
                onChange={(e) => setSubmissionDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Select the date when the student submitted the project
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowSubmissionModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmissionSubmit}
                disabled={!submissionDate}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                Record Submission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectSubmissionDetail
