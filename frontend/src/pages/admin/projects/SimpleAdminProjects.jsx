import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  EyeIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  TrophyIcon,
  CalendarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { projectAPI } from '../../../services/api'
import ConfirmationModal from '../../../components/modals/ConfirmationModal'

const SimpleAdminProjects = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [deleting, setDeleting] = useState(null)
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    projectId: null,
    projectTitle: '',
    submissionCount: 0
  })
  const [stats, setStats] = useState({
    total: 0,
    assigned: 0,
    inProgress: 0,
    completed: 0
  })

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await projectAPI.getProjects()
      const allProjects = response.data || []
      
      setProjects(allProjects)
      
      // Calculate stats
      const stats = {
        total: allProjects.length,
        assigned: allProjects.filter(p => p.status === 'assigned').length,
        inProgress: allProjects.filter(p => p.status === 'in_progress').length,
        completed: allProjects.filter(p => p.status === 'completed').length
      }
      setStats(stats)
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast.error('Failed to fetch projects')
    } finally {
      setLoading(false)
    }
  }

  const getFilteredProjects = () => {
    if (filter === 'all') return projects
    return projects.filter(project => project.status === filter)
  }

  const openDeleteModal = (project) => {
    setDeleteModal({
      isOpen: true,
      projectId: project._id,
      projectTitle: project.title,
      submissionCount: project.submissionCount || 0
    })
  }

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      projectId: null,
      projectTitle: '',
      submissionCount: 0
    })
  }

  const handleDeleteProject = async () => {
    try {
      setDeleting(deleteModal.projectId)
      await projectAPI.deleteProject(deleteModal.projectId)
      toast.success('Project deleted successfully')
      closeDeleteModal()
      fetchProjects() // Refresh data
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error(error.response?.data?.message || 'Failed to delete project')
    } finally {
      setDeleting(null)
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      assigned: { color: 'bg-blue-100 text-blue-800', text: 'Assigned', icon: ClockIcon },
      in_progress: { color: 'bg-yellow-100 text-yellow-800', text: 'In Progress', icon: ClockIcon },
      completed: { color: 'bg-green-100 text-green-800', text: 'Completed', icon: CheckCircleIcon }
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

  const getProgressBar = (submitted, total) => {
    const percentage = total > 0 ? (submitted / total) * 100 : 0
    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-green-600 h-2 rounded-full transition-all duration-300" 
          style={{ width: `${percentage}%` }}
        ></div>
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

  const filteredProjects = getFilteredProjects()

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Project Overview</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Monitor all projects across batches and teachers
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Assigned</p>
              <p className="text-2xl font-bold text-blue-600">{stats.assigned}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">In Progress</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {[
            { key: 'all', label: 'All Projects', count: stats.total },
            { key: 'assigned', label: 'Assigned', count: stats.assigned },
            { key: 'in_progress', label: 'In Progress', count: stats.inProgress },
            { key: 'completed', label: 'Completed', count: stats.completed }
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
        <div className="text-center py-8 sm:py-12">
          <DocumentTextIcon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
          <h3 className="mt-2 text-sm sm:text-base font-medium text-gray-900">No projects found</h3>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 max-w-sm mx-auto">
            {filter === 'all' ? 'No projects have been created yet.' : `No ${filter} projects found.`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch & Teacher
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deadline
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProjects.map((project) => (
                  <tr key={project._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 line-clamp-1">
                          {project.title}
                        </div>
                        <div className="text-sm text-gray-500 line-clamp-2">
                          {project.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {project.batch?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {project.assignedBy?.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(project.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-24">
                        {getProgressBar(project.submissionCount || 0, project.batch?.studentCount || 0)}
                        <div className="text-xs text-gray-500 mt-1">
                          {project.submissionCount || 0}/{project.batch?.studentCount || 0}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
                        {format(new Date(project.deadlineDate), 'MMM dd, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          to={`/admin/projects/${project._id}/details`}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/admin/projects/${project._id}/analytics`}
                          className="text-green-600 hover:text-green-900"
                          title="View Analytics"
                        >
                          <ChartBarIcon className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/admin/projects/edit/${project._id}`}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Edit Project"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => openDeleteModal(project)}
                          disabled={deleting === project._id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          title="Delete Project"
                        >
                          {deleting === project._id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <TrashIcon className="h-4 w-4" />
                          )}
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        message={
          deleteModal.submissionCount > 0
            ? `Are you sure you want to delete "${deleteModal.projectTitle}"? This project has ${deleteModal.submissionCount} submission(s) that will also be permanently removed. This action cannot be undone.`
            : `Are you sure you want to delete "${deleteModal.projectTitle}"? This action cannot be undone.`
        }
        confirmText="Delete Project"
        cancelText="Cancel"
        type="danger"
        loading={deleting === deleteModal.projectId}
      />
    </div>
  )
}

export default SimpleAdminProjects
