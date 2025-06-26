import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeftIcon,
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CalendarIcon,
  ClockIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { format, isAfter, differenceInDays } from 'date-fns'
import toast from 'react-hot-toast'
import { projectAPI } from '../../../services/api'

const StudentProjectSubmit = () => {
  const { projectId } = useParams()
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
    if (projectId) {
      fetchProject()
    }
  }, [projectId])

  const fetchProject = async () => {
    try {
      setLoading(true)
      const response = await projectAPI.getProject(projectId)
      setProject(response.data)
    } catch (error) {
      console.error('Error fetching project:', error)
      toast.error('Failed to fetch project details')
      navigate('/projects')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files)
    const maxSize = 50 * 1024 * 1024 // 50MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/zip',
      'application/x-zip-compressed',
      'image/jpeg',
      'image/png',
      'image/gif'
    ]

    const validFiles = selectedFiles.filter(file => {
      if (file.size > maxSize) {
        toast.error(`File ${file.name} is too large. Maximum size is 50MB.`)
        return false
      }
      if (!allowedTypes.includes(file.type)) {
        toast.error(`File ${file.name} has an unsupported format.`)
        return false
      }
      return true
    })

    setFiles(prev => [...prev, ...validFiles])
  }

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.description.trim()) {
      toast.error('Please provide a project description')
      return
    }

    if (files.length === 0) {
      toast.error('Please upload at least one file')
      return
    }

    try {
      setSubmitting(true)
      
      const submitData = new FormData()
      submitData.append('description', formData.description)
      submitData.append('notes', formData.notes)
      
      files.forEach((file, index) => {
        submitData.append('files', file)
      })

      await projectAPI.submitProject(projectId, submitData)
      toast.success('Project submitted successfully!')
      navigate('/projects')
    } catch (error) {
      console.error('Error submitting project:', error)
      toast.error(error.response?.data?.message || 'Failed to submit project')
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
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Project not found</h3>
        <p className="mt-1 text-sm text-gray-500">The project you're looking for doesn't exist.</p>
      </div>
    )
  }

  const deadline = new Date(project.deadlineDate)
  const now = new Date()
  const isOverdue = isAfter(now, deadline)
  const daysLeft = differenceInDays(deadline, now)

  if (isOverdue) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 px-4 sm:px-0">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/projects')}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Project Submission</h1>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-600 mb-4" />
          <h3 className="text-lg font-medium text-red-900 mb-2">Submission Deadline Passed</h3>
          <p className="text-red-700">
            The deadline for this project was {format(deadline, 'MMMM dd, yyyy')}. 
            Submissions are no longer accepted.
          </p>
          <button
            onClick={() => navigate('/projects')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
          >
            Back to Projects
          </button>
        </div>
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Submit Project</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Upload your project files and provide details
          </p>
        </div>
      </div>

      {/* Project Info */}
      <div className="bg-blue-50 rounded-lg p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">{project.title}</h2>
        <p className="text-blue-800 mb-4">{project.description}</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center text-blue-700">
            <CalendarIcon className="h-4 w-4 mr-2" />
            <span>Due: {format(deadline, 'MMMM dd, yyyy')}</span>
          </div>
          <div className="flex items-center text-blue-700">
            <ClockIcon className="h-4 w-4 mr-2" />
            <span>
              {daysLeft > 0 ? `${daysLeft} days left` : 'Due today'}
            </span>
          </div>
        </div>

        {daysLeft <= 3 && daysLeft > 0 && (
          <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-md">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
              <span className="text-yellow-800 text-sm font-medium">
                Deadline approaching! Only {daysLeft} day{daysLeft !== 1 ? 's' : ''} left.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Submission Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
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
              placeholder="Describe your project, what you've built, technologies used, challenges faced, etc..."
              required
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Files *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Upload project files
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    PDF, DOC, TXT, ZIP, Images up to 50MB each
                  </span>
                </label>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  multiple
                  className="sr-only"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt,.zip,.jpg,.jpeg,.png,.gif"
                />
              </div>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Selected Files:</h4>
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <DocumentArrowUpIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{file.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Any additional information, special instructions, or notes for the teacher..."
            />
          </div>

          {/* Submit Button */}
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
              disabled={submitting || files.length === 0}
              className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Submit Project
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default StudentProjectSubmit
