import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  InboxIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  PencilIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserIcon,
  CalendarIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  BellIcon,
  DocumentTextIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { format, formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { projectAPI } from '../../../services/api'

const SubmissionInbox = () => {
  const navigate = useNavigate()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState({
    status: '',
    project: '',
    timing: '',
    search: '',
    sortBy: 'submittedDate',
    order: 'desc'
  })
  const [projects, setProjects] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    graded: 0,
    returned: 0
  })

  useEffect(() => {
    fetchData()
  }, [filter])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [submissionsResponse, projectsResponse] = await Promise.all([
        projectAPI.getAllSubmissions(filter),
        projectAPI.getProjects({ status: 'assigned,in_progress' })
      ])
      
      setSubmissions(submissionsResponse.data.submissions || [])
      setStats(submissionsResponse.data.stats || stats)
      setProjects(projectsResponse.data || [])
    } catch (error) {
      console.error('Error fetching submissions:', error)
      toast.error('Failed to fetch submissions')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      await fetchData()
      toast.success('Submissions refreshed')
    } catch (error) {
      toast.error('Failed to refresh submissions')
    } finally {
      setRefreshing(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      submitted: { color: 'bg-blue-100 text-blue-800', text: 'New Submission', icon: InboxIcon },
      under_review: { color: 'bg-yellow-100 text-yellow-800', text: 'Under Review', icon: ClockIcon },
      graded: { color: 'bg-green-100 text-green-800', text: 'Graded', icon: CheckCircleIcon },
      returned: { color: 'bg-orange-100 text-orange-800', text: 'Returned', icon: ExclamationTriangleIcon }
    }
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', text: status, icon: DocumentTextIcon }
    const IconComponent = config.icon
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.text}
      </span>
    )
  }

  const getTimingBadge = (timing) => {
    const timingConfig = {
      early: { color: 'bg-green-100 text-green-800', text: 'Early' },
      on_time: { color: 'bg-blue-100 text-blue-800', text: 'On Time' },
      late: { color: 'bg-red-100 text-red-800', text: 'Late' }
    }
    
    const config = timingConfig[timing] || { color: 'bg-gray-100 text-gray-800', text: timing }
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    )
  }

  const markAsReviewed = async (submissionId) => {
    try {
      await projectAPI.updateSubmissionStatus(submissionId, { status: 'under_review' })
      setSubmissions(prev => prev.map(sub => 
        sub._id === submissionId ? { ...sub, status: 'under_review' } : sub
      ))
      toast.success('Marked as under review')
    } catch (error) {
      console.error('Error updating submission:', error)
      toast.error('Failed to update submission status')
    }
  }

  const downloadSubmissionFiles = async (submission) => {
    try {
      if (submission.files && submission.files.length > 0) {
        // Download first file or create a zip if multiple files
        const file = submission.files[0]
        const response = await projectAPI.downloadSubmissionFile(submission._id, file.fileName)
        
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', file.originalName)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
        
        toast.success('File downloaded successfully')
      } else {
        toast.error('No files available for download')
      }
    } catch (error) {
      console.error('Error downloading file:', error)
      toast.error('Failed to download file')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
            <InboxIcon className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 mr-2" />
            Submission Inbox
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Manage and review student project submissions
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <InboxIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Submissions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Graded</p>
              <p className="text-2xl font-bold text-gray-900">{stats.graded}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Returned</p>
              <p className="text-2xl font-bold text-gray-900">{stats.returned}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-sm font-medium text-gray-900">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={filter.search}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                placeholder="Search students..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="submitted">New Submissions</option>
              <option value="under_review">Under Review</option>
              <option value="graded">Graded</option>
              <option value="returned">Returned</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
            <select
              value={filter.project}
              onChange={(e) => setFilter({ ...filter, project: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
            >
              <option value="">All Projects</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Timing</label>
            <select
              value={filter.timing}
              onChange={(e) => setFilter({ ...filter, timing: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
            >
              <option value="">All Timings</option>
              <option value="early">Early</option>
              <option value="on_time">On Time</option>
              <option value="late">Late</option>
            </select>
          </div>
        </div>
      </div>

      {/* Submissions List */}
      {submissions.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <InboxIcon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
          <h3 className="mt-2 text-sm sm:text-base font-medium text-gray-900">No submissions found</h3>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 max-w-sm mx-auto">
            No submissions match your current filters.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student & Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Files
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
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {submission.student?.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {submission.project?.title}
                          </div>
                          <div className="text-xs text-gray-400">
                            {submission.student?.rollNo} • {submission.student?.studentId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(submission.submittedDate), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(submission.submittedDate), { addSuffix: true })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(submission.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTimingBadge(submission.submissionTiming)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {submission.files?.length || 0} files
                      </div>
                      <div className="text-xs text-gray-500">
                        {submission.files?.reduce((total, file) => total + file.fileSize, 0)
                          ? `${(submission.files.reduce((total, file) => total + file.fileSize, 0) / (1024 * 1024)).toFixed(1)} MB`
                          : '0 MB'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => navigate(`/projects/${submission.project._id}/submissions/${submission._id}`)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>

                      {submission.files && submission.files.length > 0 && (
                        <button
                          onClick={() => downloadSubmissionFiles(submission)}
                          className="text-green-600 hover:text-green-900"
                          title="Download Files"
                        >
                          <DocumentArrowDownIcon className="h-4 w-4" />
                        </button>
                      )}

                      {submission.status === 'submitted' && (
                        <button
                          onClick={() => markAsReviewed(submission._id)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Mark as Under Review"
                        >
                          <ClockIcon className="h-4 w-4" />
                        </button>
                      )}

                      {(submission.status === 'submitted' || submission.status === 'under_review') && (
                        <button
                          onClick={() => navigate(`/projects/${submission.project._id}/submissions/${submission._id}/grade`)}
                          className="text-red-600 hover:text-red-900"
                          title="Grade Submission"
                        >
                          <PencilIcon className="h-4 w-4" />
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
    </div>
  )
}

export default SubmissionInbox
