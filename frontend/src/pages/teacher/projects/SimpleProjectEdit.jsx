import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeftIcon,
  CalendarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { format, addDays } from 'date-fns'
import toast from 'react-hot-toast'
import { projectAPI } from '../../../services/api'

const SimpleProjectEdit = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadlineDate: '',
    maxScore: 100
  })

  useEffect(() => {
    if (projectId) {
      fetchProject()
    }
  }, [projectId])

  const fetchProject = async () => {
    try {
      setLoading(true)
      const response = await projectAPI.getProject(projectId)
      const projectData = response.data
      
      setProject(projectData)
      setFormData({
        title: projectData.title || '',
        description: projectData.description || '',
        deadlineDate: projectData.deadlineDate ? format(new Date(projectData.deadlineDate), 'yyyy-MM-dd') : '',
        maxScore: projectData.maxScore || 100
      })
    } catch (error) {
      console.error('Error fetching project:', error)
      toast.error('Failed to fetch project details')
      navigate('/projects')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast.error('Please enter a project title')
      return
    }
    
    if (!formData.description.trim()) {
      toast.error('Please enter a project description')
      return
    }

    try {
      setSubmitting(true)
      
      await projectAPI.updateProject(projectId, formData)
      toast.success('Project updated successfully!')
      navigate('/projects')
    } catch (error) {
      console.error('Error updating project:', error)
      toast.error(error.response?.data?.message || 'Failed to update project')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
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
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/projects')}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Edit Project</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Update project details and settings
          </p>
        </div>
      </div>

      {/* Project Status Info */}
      <div className="bg-blue-50 rounded-lg p-4 sm:p-6">
        <div className="flex items-center mb-3">
          <UserGroupIcon className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold text-blue-900">Project Information</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-blue-700 font-medium">Batch:</span>
            <span className="ml-2 text-blue-900">{project.batch?.name}</span>
          </div>
          <div>
            <span className="text-blue-700 font-medium">Course:</span>
            <span className="ml-2 text-blue-900">{project.batch?.course?.name}</span>
          </div>
          <div>
            <span className="text-blue-700 font-medium">Status:</span>
            <span className="ml-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                project.status === 'completed' ? 'bg-green-100 text-green-800' :
                project.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {project.status === 'completed' && <CheckCircleIcon className="h-3 w-3 mr-1" />}
                {project.status === 'in_progress' && <ClockIcon className="h-3 w-3 mr-1" />}
                {project.status === 'assigned' && <DocumentTextIcon className="h-3 w-3 mr-1" />}
                {project.status === 'completed' ? 'Completed' : 
                 project.status === 'in_progress' ? 'In Progress' : 'Assigned'}
              </span>
            </span>
          </div>
          <div>
            <span className="text-blue-700 font-medium">Submissions:</span>
            <span className="ml-2 text-blue-900">{project.submissionCount || 0} received</span>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Enter project title..."
              required
            />
          </div>

          {/* Project Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Describe the project requirements, objectives, and deliverables..."
              required
            />
          </div>

          {/* Deadline and Score */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Deadline Date *
              </label>
              <input
                type="date"
                name="deadlineDate"
                value={formData.deadlineDate}
                onChange={handleChange}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Score
              </label>
              <input
                type="number"
                name="maxScore"
                value={formData.maxScore}
                onChange={handleChange}
                min="1"
                max="1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              Updated Project Preview
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-700">Title:</span>
                <span className="ml-2 text-gray-900">{formData.title || 'Project title will appear here'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Deadline:</span>
                <span className="ml-2 text-gray-900">
                  {formData.deadlineDate ? format(new Date(formData.deadlineDate), 'MMMM dd, yyyy') : 'No deadline set'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Max Score:</span>
                <span className="ml-2 text-gray-900">{formData.maxScore} points</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Update Project
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SimpleProjectEdit
