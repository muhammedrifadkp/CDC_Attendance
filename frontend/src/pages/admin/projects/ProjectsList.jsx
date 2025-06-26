import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ChartBarIcon,
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentArrowDownIcon,
  TrophyIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { projectAPI } from '../../../services/api'
import ProjectCompletionModal from '../../../components/projects/ProjectCompletionModal'

const ProjectsList = () => {
  const location = useLocation()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    status: '',
    batch: '',
    course: ''
  })
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState(null)

  // Determine if we're in admin or teacher context
  const isAdminContext = location.pathname.startsWith('/admin')
  const basePath = isAdminContext ? '/admin' : ''

  useEffect(() => {
    fetchProjects()
  }, [filter])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await projectAPI.getProjects(filter)
      setProjects(response.data)
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast.error('Failed to fetch projects')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return
    }

    try {
      await projectAPI.deleteProject(projectId)
      toast.success('Project deleted successfully')
      fetchProjects()
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error(error.response?.data?.message || 'Failed to delete project')
    }
  }

  const handleCompleteProject = (projectId) => {
    setSelectedProjectId(projectId)
    setShowCompletionModal(true)
  }

  const handleProjectCompletion = (completionData) => {
    // Update the project in the list
    setProjects(prev => prev.map(project =>
      project._id === selectedProjectId
        ? { ...project, status: 'completed', completedDate: completionData.project.completedDate }
        : project
    ))
    setShowCompletionModal(false)
    setSelectedProjectId(null)
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', text: 'Draft' },
      assigned: { color: 'bg-blue-100 text-blue-800', text: 'Assigned' },
      in_progress: { color: 'bg-yellow-100 text-yellow-800', text: 'In Progress' },
      completed: { color: 'bg-green-100 text-green-800', text: 'Completed' },
      archived: { color: 'bg-gray-100 text-gray-600', text: 'Archived' }
    }

    const config = statusConfig[status] || statusConfig.draft

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    )
  }

  const getDaysRemaining = (deadlineDate) => {
    const now = new Date()
    const deadline = new Date(deadlineDate)
    const diffTime = deadline - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return <span className="text-red-600 font-medium">Overdue by {Math.abs(diffDays)} days</span>
    } else if (diffDays === 0) {
      return <span className="text-orange-600 font-medium">Due today</span>
    } else if (diffDays <= 3) {
      return <span className="text-yellow-600 font-medium">{diffDays} days remaining</span>
    } else {
      return <span className="text-green-600">{diffDays} days remaining</span>
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Project Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage projects for finished batches</p>
        </div>
        <Link
          to={`${basePath}/projects/new`}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 w-full sm:w-auto"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Assign New Project
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="text-center py-8 sm:py-12 px-4">
          <ChartBarIcon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
          <h3 className="mt-2 text-sm sm:text-base font-medium text-gray-900">No projects found</h3>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 max-w-sm mx-auto">
            Get started by assigning a project to a finished batch.
          </p>
          <div className="mt-4 sm:mt-6">
            <Link
              to={`${basePath}/projects/new`}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 w-full sm:w-auto justify-center"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Assign New Project
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {projects.map((project) => (
            <div key={project._id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
              <div className="p-4 sm:p-6">
                <div className="flex flex-col space-y-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 truncate">
                      {project.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-2">
                      {project.description}
                    </p>
                  </div>
                  <div className="flex-shrink-0 self-start">
                    {getStatusBadge(project.status)}
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center text-xs sm:text-sm text-gray-600">
                    <UserGroupIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{project.batch?.name} - {project.course?.name}</span>
                  </div>

                  <div className="flex items-center text-xs sm:text-sm text-gray-600">
                    <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                    <span>Assigned: {format(new Date(project.assignedDate), 'MMM dd, yyyy')}</span>
                  </div>

                  <div className="flex items-center text-xs sm:text-sm">
                    <ClockIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-gray-600 flex-shrink-0" />
                    <span>Deadline: {format(new Date(project.deadlineDate), 'MMM dd, yyyy')}</span>
                  </div>

                  <div className="text-xs sm:text-sm">
                    {getDaysRemaining(project.deadlineDate)}
                  </div>

                  {project.submissionCount !== undefined && (
                    <div className="text-xs sm:text-sm text-gray-600">
                      <span className="font-medium">{project.submissionCount}</span> submissions
                    </div>
                  )}
                </div>

                <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`${basePath}/projects/${project._id}/submissions`}
                      className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none justify-center"
                    >
                      <DocumentArrowDownIcon className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Submitted ({project.submissionCount || 0})</span>
                      <span className="sm:hidden">Submitted</span>
                    </Link>
                    <Link
                      to={`${basePath}/projects/${project._id}/analytics`}
                      className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 flex-1 sm:flex-none justify-center"
                    >
                      <ChartBarIcon className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Analytics</span>
                      <span className="sm:hidden">Stats</span>
                    </Link>
                  </div>

                  <div className="flex space-x-1 justify-end">
                    {project.status !== 'completed' && project.status !== 'archived' && (
                      <button
                        onClick={() => handleCompleteProject(project._id)}
                        className="p-1.5 text-gray-400 hover:text-green-600 rounded-md hover:bg-green-50"
                        title="Complete Project"
                      >
                        <TrophyIcon className="h-4 w-4" />
                      </button>
                    )}
                    {project.status === 'completed' && (
                      <div className="p-1.5 text-green-600" title="Project Completed">
                        <CheckCircleIcon className="h-4 w-4" />
                      </div>
                    )}
                    <Link
                      to={`${basePath}/projects/${project._id}/edit`}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                      title="Edit Project"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDeleteProject(project._id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
                      title="Delete Project"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Completion Modal */}
      <ProjectCompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        projectId={selectedProjectId}
        onComplete={handleProjectCompletion}
      />
    </div>
  )
}

export default ProjectsList
