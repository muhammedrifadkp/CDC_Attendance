import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CalendarIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { projectAPI } from '../../../services/api'
import ConfirmationModal from '../../../components/modals/ConfirmationModal'

const SimpleProjectDashboard = () => {
  const navigate = useNavigate()
  const [projects, setProjects] = useState({
    assign: [],
    working: [],
    completed: []
  })
  const [finishedBatches, setFinishedBatches] = useState([])
  const [activeBatches, setActiveBatches] = useState([])
  const [batchMessage, setBatchMessage] = useState('')
  const [batchesData, setBatchesData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('assign')
  const [deleting, setDeleting] = useState(null)
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    projectId: null,
    projectTitle: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [projectsResponse, batchesResponse] = await Promise.all([
        projectAPI.getProjects(),
        projectAPI.getFinishedBatches()
      ])

      // Categorize projects
      const allProjects = projectsResponse.data || []
      const categorized = {
        assign: [],
        working: allProjects.filter(p => p.status === 'assigned' || p.status === 'in_progress'),
        completed: allProjects.filter(p => p.status === 'completed')
      }

      setProjects(categorized)

      // Handle new API response format
      if (batchesResponse.data && typeof batchesResponse.data === 'object' && batchesResponse.data.finishedBatches) {
        setFinishedBatches(batchesResponse.data.finishedBatches || [])
        setActiveBatches(batchesResponse.data.activeBatches || [])
        setBatchMessage(batchesResponse.data.message || '')
        setBatchesData(batchesResponse.data)
      } else {
        // Fallback for old API format (array of batches)
        setFinishedBatches(Array.isArray(batchesResponse.data) ? batchesResponse.data : [])
        setActiveBatches([])
        setBatchMessage('')
        setBatchesData(null)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to fetch projects')
    } finally {
      setLoading(false)
    }
  }

  const getTabCount = (tab) => {
    if (tab === 'assign') return finishedBatches.length
    return projects[tab].length
  }

  const openDeleteModal = (projectId, projectTitle) => {
    setDeleteModal({
      isOpen: true,
      projectId,
      projectTitle
    })
  }

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      projectId: null,
      projectTitle: ''
    })
  }

  const handleDeleteProject = async () => {
    try {
      setDeleting(deleteModal.projectId)
      await projectAPI.deleteProject(deleteModal.projectId)
      toast.success('Project deleted successfully')
      closeDeleteModal()
      fetchData() // Refresh data
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error(error.response?.data?.message || 'Failed to delete project')
    } finally {
      setDeleting(null)
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      assigned: { color: 'bg-blue-100 text-blue-800', text: 'Assigned' },
      in_progress: { color: 'bg-yellow-100 text-yellow-800', text: 'In Progress' },
      completed: { color: 'bg-green-100 text-green-800', text: 'Completed' }
    }
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', text: status }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
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

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Project Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Manage your batch projects from assignment to completion
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {[
            { key: 'assign', label: 'Assign Projects', icon: PlusIcon },
            { key: 'working', label: 'Working', icon: ClockIcon },
            { key: 'completed', label: 'Completed', icon: CheckCircleIcon }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.key ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {getTabCount(tab.key)}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="mt-6">
        {/* Assign Projects Tab */}
        {activeTab === 'assign' && (
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Finished Batches Ready for Projects</h2>
              <p className="text-sm text-gray-600">
                These batches have completed their course and are ready for project assignments.
              </p>
            </div>

            {finishedBatches.length === 0 ? (
              <div className="space-y-6">
                <div className="text-center py-8 sm:py-12">
                  <UserGroupIcon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm sm:text-base font-medium text-gray-900">No finished batches</h3>
                  <p className="mt-1 text-xs sm:text-sm text-gray-500 max-w-sm mx-auto">
                    {batchMessage || 'Mark some batches as finished to assign projects.'}
                  </p>
                  {batchesData?.totalFinishedBatches > 0 && batchesData?.batchesWithProjects > 0 && (
                    <div className="mt-2 text-xs text-gray-400">
                      {batchesData.batchesWithProjects} of {batchesData.totalFinishedBatches} finished batches have projects
                    </div>
                  )}
                </div>

                {/* Show active batches that can be marked as finished */}
                {activeBatches.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4 sm:p-6">
                    <div className="flex items-center mb-4">
                      <ClockIcon className="h-6 w-6 text-blue-600 mr-2" />
                      <h3 className="text-lg font-semibold text-blue-900">Active Batches</h3>
                    </div>
                    <p className="text-sm text-blue-700 mb-4">
                      These batches can be marked as finished to enable project assignment:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(activeBatches || []).map((batch) => (
                        <div key={batch._id} className="bg-white rounded-lg p-4 border border-blue-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">{batch.name}</h4>
                              <p className="text-xs text-gray-500">{batch.course?.name}</p>
                              <p className="text-xs text-gray-500">{batch.studentCount || 0} students</p>
                            </div>
                            <Link
                              to={`/batches/${batch._id}`}
                              className="inline-flex items-center px-3 py-1 border border-blue-300 text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
                            >
                              Mark Finished
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {(finishedBatches || []).map((batch) => (
                  <div key={batch._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-4">
                      <div className="flex-shrink-0">
                        <UserGroupIcon className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="ml-3 flex-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate">{batch.name}</h3>
                        <p className="text-xs text-gray-500">{batch.course?.name}</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Students:</span>
                        <span className="font-medium">{batch.studentCount || 0}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Completed:</span>
                        <span className="font-medium">{format(new Date(batch.endDate), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>

                    <Link
                      to={`/projects/assign/${batch._id}`}
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Assign Project
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Working Projects Tab */}
        {activeTab === 'working' && (
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Active Projects</h2>
              <p className="text-sm text-gray-600">
                Projects currently assigned to batches and in progress.
              </p>
            </div>

            {projects.working.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <ClockIcon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                <h3 className="mt-2 text-sm sm:text-base font-medium text-gray-900">No active projects</h3>
                <p className="mt-1 text-xs sm:text-sm text-gray-500 max-w-sm mx-auto">
                  Assign projects to finished batches to get started.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {projects.working.map((project) => (
                  <div key={project._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">{project.title}</h3>
                        <p className="text-xs text-gray-500">{project.batch?.name}</p>
                      </div>
                      {getStatusBadge(project.status)}
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Deadline:</span>
                        <span className="font-medium">{format(new Date(project.deadlineDate), 'MMM dd')}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Submissions:</span>
                        <span className="font-medium">{project.submissionCount || 0}/{project.batch?.studentCount || 0}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <Link
                          to={`/projects/${project._id}/submissions`}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <EyeIcon className="h-3 w-3 mr-1" />
                          View
                        </Link>
                        <Link
                          to={`/projects/${project._id}/manage`}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <PencilIcon className="h-3 w-3 mr-1" />
                          Manage
                        </Link>
                      </div>
                      <div className="flex space-x-2">
                        <Link
                          to={`/projects/edit/${project._id}`}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <PencilIcon className="h-3 w-3 mr-1" />
                          Edit
                        </Link>
                        <button
                          onClick={() => openDeleteModal(project._id, project.title)}
                          disabled={deleting === project._id}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                        >
                          {deleting === project._id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                          ) : (
                            <TrashIcon className="h-3 w-3 mr-1" />
                          )}
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Completed Projects Tab */}
        {activeTab === 'completed' && (
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Completed Projects</h2>
              <p className="text-sm text-gray-600">
                Projects that have been completed with all submissions graded.
              </p>
            </div>

            {projects.completed.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <CheckCircleIcon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                <h3 className="mt-2 text-sm sm:text-base font-medium text-gray-900">No completed projects</h3>
                <p className="mt-1 text-xs sm:text-sm text-gray-500 max-w-sm mx-auto">
                  Complete some projects to see them here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {projects.completed.map((project) => (
                  <div key={project._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">{project.title}</h3>
                        <p className="text-xs text-gray-500">{project.batch?.name}</p>
                      </div>
                      {getStatusBadge(project.status)}
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Completed:</span>
                        <span className="font-medium">{format(new Date(project.completedDate), 'MMM dd')}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Submissions:</span>
                        <span className="font-medium text-green-600">{project.submissionCount || 0}/{project.batch?.studentCount || 0}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Link
                        to={`/projects/${project._id}/results`}
                        className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                      >
                        <EyeIcon className="h-4 w-4 mr-2" />
                        View Results
                      </Link>
                      <div className="flex space-x-2">
                        <Link
                          to={`/projects/edit/${project._id}`}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <PencilIcon className="h-3 w-3 mr-1" />
                          Edit
                        </Link>
                        <button
                          onClick={() => openDeleteModal(project._id, project.title)}
                          disabled={deleting === project._id}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                        >
                          {deleting === project._id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                          ) : (
                            <TrashIcon className="h-3 w-3 mr-1" />
                          )}
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteModal.projectTitle}"? This action cannot be undone and will remove all project data.`}
        confirmText="Delete Project"
        cancelText="Cancel"
        type="danger"
        loading={deleting === deleteModal.projectId}
      />
    </div>
  )
}

export default SimpleProjectDashboard
