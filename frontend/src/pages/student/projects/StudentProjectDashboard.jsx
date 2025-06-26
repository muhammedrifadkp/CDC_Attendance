import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  TrophyIcon,
  EyeIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { format, isAfter, isBefore, differenceInDays } from 'date-fns'
import toast from 'react-hot-toast'
import { projectAPI } from '../../../services/api'

const StudentProjectDashboard = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await projectAPI.getMyProjects()
      setProjects(response.data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast.error('Failed to fetch projects')
    } finally {
      setLoading(false)
    }
  }

  const getProjectStatus = (project) => {
    const now = new Date()
    const deadline = new Date(project.deadlineDate)
    const hasSubmission = project.submissions && project.submissions.length > 0

    if (hasSubmission) {
      const submission = project.submissions[0]
      if (submission.grade !== null && submission.grade !== undefined) {
        return { status: 'graded', color: 'green', text: 'Graded' }
      }
      return { status: 'submitted', color: 'blue', text: 'Submitted' }
    }

    if (isAfter(now, deadline)) {
      return { status: 'overdue', color: 'red', text: 'Overdue' }
    }

    const daysLeft = differenceInDays(deadline, now)
    if (daysLeft <= 3) {
      return { status: 'due_soon', color: 'yellow', text: 'Due Soon' }
    }

    return { status: 'pending', color: 'gray', text: 'Pending' }
  }

  const getFilteredProjects = () => {
    if (filter === 'all') return projects
    return projects.filter(project => {
      const { status } = getProjectStatus(project)
      return status === filter
    })
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'graded':
        return <TrophyIcon className="h-5 w-5" />
      case 'submitted':
        return <CheckCircleIcon className="h-5 w-5" />
      case 'overdue':
        return <ExclamationTriangleIcon className="h-5 w-5" />
      case 'due_soon':
        return <ClockIcon className="h-5 w-5" />
      default:
        return <DocumentTextIcon className="h-5 w-5" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
          <p className="text-gray-600">Loading your projects...</p>
        </div>
      </div>
    )
  }

  const filteredProjects = getFilteredProjects()
  const stats = {
    total: projects.length,
    pending: projects.filter(p => getProjectStatus(p).status === 'pending').length,
    submitted: projects.filter(p => getProjectStatus(p).status === 'submitted').length,
    graded: projects.filter(p => getProjectStatus(p).status === 'graded').length,
    overdue: projects.filter(p => getProjectStatus(p).status === 'overdue').length
  }

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
        <p className="text-gray-600 mt-1">
          View and submit your assigned projects
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-gray-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-gray-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-gray-600">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Submitted</p>
              <p className="text-2xl font-bold text-blue-600">{stats.submitted}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <TrophyIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Graded</p>
              <p className="text-2xl font-bold text-green-600">{stats.graded}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {[
            { key: 'all', label: 'All Projects', count: stats.total },
            { key: 'pending', label: 'Pending', count: stats.pending },
            { key: 'submitted', label: 'Submitted', count: stats.submitted },
            { key: 'graded', label: 'Graded', count: stats.graded },
            { key: 'overdue', label: 'Overdue', count: stats.overdue }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                filter === tab.key
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                filter === tab.key ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No projects found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'all' ? 'No projects have been assigned yet.' : `No ${filter} projects found.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const { status, color, text } = getProjectStatus(project)
            const deadline = new Date(project.deadlineDate)
            const daysLeft = differenceInDays(deadline, new Date())
            const hasSubmission = project.submissions && project.submissions.length > 0
            const submission = hasSubmission ? project.submissions[0] : null

            return (
              <div key={project._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
                      {project.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                      {project.description}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    color === 'green' ? 'bg-green-100 text-green-800' :
                    color === 'blue' ? 'bg-blue-100 text-blue-800' :
                    color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                    color === 'red' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {getStatusIcon(status)}
                    <span className="ml-1">{text}</span>
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    <span>Due: {format(deadline, 'MMM dd, yyyy')}</span>
                    {daysLeft >= 0 && (
                      <span className={`ml-2 text-xs ${daysLeft <= 3 ? 'text-red-600' : 'text-gray-500'}`}>
                        ({daysLeft} days left)
                      </span>
                    )}
                  </div>
                  
                  {submission && (
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      <span>Submitted: {format(new Date(submission.submittedDate), 'MMM dd, yyyy')}</span>
                    </div>
                  )}

                  {submission?.grade !== null && submission?.grade !== undefined && (
                    <div className="flex items-center text-sm text-green-600">
                      <TrophyIcon className="h-4 w-4 mr-2" />
                      <span>Grade: {submission.grade}/{project.maxScore}</span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Link
                    to={`/projects/${project._id}`}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <EyeIcon className="h-4 w-4 mr-2" />
                    View Details
                  </Link>
                  
                  {!hasSubmission && status !== 'overdue' && (
                    <Link
                      to={`/projects/${project._id}/submit`}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Submit
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default StudentProjectDashboard
