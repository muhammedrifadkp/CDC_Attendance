import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  DocumentArrowUpIcon, 
  CalendarIcon, 
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { projectAPI } from '../../services/api'

const ProjectSubmission = () => {
  const { projectId, studentId } = useParams()
  const navigate = useNavigate()
  
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [files, setFiles] = useState([])
  const [formData, setFormData] = useState({
    description: '',
    notes: ''
  })

  useEffect(() => {
    fetchProjectDetails()
  }, [projectId])

  const fetchProjectDetails = async () => {
    try {
      setLoading(true)
      const response = await projectAPI.getProject(projectId)
      setProject(response.data)
    } catch (error) {
      console.error('Error fetching project:', error)
      toast.error('Failed to fetch project details')
      navigate(-1)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files)
    
    // Validate file sizes
    const maxSize = 50 * 1024 * 1024 // 50MB
    const invalidFiles = selectedFiles.filter(file => file.size > maxSize)
    
    if (invalidFiles.length > 0) {
      toast.error(`Some files exceed the 50MB limit: ${invalidFiles.map(f => f.name).join(', ')}`)
      return
    }
    
    setFiles(selectedFiles)
  }

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (files.length === 0) {
      toast.error('Please select at least one file to submit')
      return
    }
    
    if (!formData.description.trim()) {
      toast.error('Please provide a description of your submission')
      return
    }

    try {
      setSubmitting(true)
      
      const submitData = new FormData()
      submitData.append('studentId', studentId)
      submitData.append('description', formData.description)
      submitData.append('notes', formData.notes)
      
      files.forEach((file) => {
        submitData.append('files', file)
      })
      
      await projectAPI.submitProject(projectId, submitData)
      toast.success('Project submitted successfully!')
      navigate(`/student/${studentId}/projects`)
    } catch (error) {
      console.error('Error submitting project:', error)
      toast.error(error.response?.data?.message || 'Failed to submit project')
    } finally {
      setSubmitting(false)
    }
  }

  const getDaysRemaining = (deadlineDate) => {
    const now = new Date()
    const deadline = new Date(deadlineDate)
    const diffTime = deadline - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  }

  const getDeadlineStatus = (deadlineDate) => {
    const daysRemaining = getDaysRemaining(deadlineDate)
    
    if (daysRemaining < 0) {
      return {
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        icon: ExclamationTriangleIcon,
        text: `Overdue by ${Math.abs(daysRemaining)} day(s)`
      }
    } else if (daysRemaining === 0) {
      return {
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        icon: ExclamationTriangleIcon,
        text: 'Due today'
      }
    } else if (daysRemaining <= 3) {
      return {
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        icon: ClockIcon,
        text: `${daysRemaining} day(s) remaining`
      }
    } else {
      return {
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        icon: CheckCircleIcon,
        text: `${daysRemaining} day(s) remaining`
      }
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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

  const deadlineStatus = getDeadlineStatus(project.deadlineDate)

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Project Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{project.title}</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">{project.description}</p>
          </div>
          <div className={`flex items-center px-3 py-2 rounded-lg ${deadlineStatus.bgColor} flex-shrink-0 self-start`}>
            <deadlineStatus.icon className={`h-4 w-4 sm:h-5 sm:w-5 mr-2 ${deadlineStatus.color}`} />
            <span className={`text-xs sm:text-sm font-medium ${deadlineStatus.color}`}>
              {deadlineStatus.text}
            </span>
          </div>
        </div>

        <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="flex items-center text-xs sm:text-sm text-gray-600">
            <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
            <span>Assigned: {format(new Date(project.assignedDate), 'MMM dd, yyyy')}</span>
          </div>
          <div className="flex items-center text-xs sm:text-sm text-gray-600">
            <ClockIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
            <span>Deadline: {format(new Date(project.deadlineDate), 'MMM dd, yyyy')}</span>
          </div>
          <div className="flex items-center text-xs sm:text-sm text-gray-600">
            <InformationCircleIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
            <span>Max Score: {project.maxScore} points</span>
          </div>
        </div>
      </div>

      {/* Project Requirements */}
      {project.requirements && project.requirements.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Requirements</h2>
          <div className="space-y-3">
            {project.requirements.map((req, index) => (
              <div key={index} className="flex items-start">
                <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 mr-3 ${req.mandatory ? 'bg-red-500' : 'bg-gray-400'}`}></div>
                <div>
                  <h3 className="font-medium text-gray-900">{req.title}</h3>
                  {req.description && (
                    <p className="text-sm text-gray-600 mt-1">{req.description}</p>
                  )}
                  {req.mandatory && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mt-1">
                      Mandatory
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deliverables */}
      {project.deliverables && project.deliverables.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Deliverables</h2>
          <div className="space-y-3">
            {project.deliverables.map((deliverable, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">{deliverable.name}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                    <span>Type: {deliverable.fileType}</span>
                    <span>Max Size: {deliverable.maxSize}MB</span>
                    {deliverable.mandatory && (
                      <span className="text-red-600 font-medium">Required</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      {project.instructions && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Instructions</h2>
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{project.instructions}</p>
          </div>
        </div>
      )}

      {/* Resources */}
      {project.resources && project.resources.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Resources</h2>
          <div className="space-y-3">
            {project.resources.map((resource, index) => (
              <div key={index} className="flex items-start">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2 mr-3"></div>
                <div>
                  <h3 className="font-medium text-gray-900">{resource.title}</h3>
                  {resource.description && (
                    <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                  )}
                  {resource.url && (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 mt-1 inline-block"
                    >
                      View Resource →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submission Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Submit Your Project</h2>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Files *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Click to upload files or drag and drop
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    Maximum file size: 50MB per file
                  </span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    multiple
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>
            
            {/* Selected Files */}
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium text-gray-900">Selected Files:</h4>
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <span className="text-sm font-medium text-gray-900">{file.name}</span>
                      <span className="text-xs text-gray-500 ml-2">({formatFileSize(file.size)})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Describe your project, approach, and key features..."
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Any additional notes or comments..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || files.length === 0}
              className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 order-1 sm:order-2"
            >
              {submitting ? 'Submitting...' : 'Submit Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProjectSubmission
