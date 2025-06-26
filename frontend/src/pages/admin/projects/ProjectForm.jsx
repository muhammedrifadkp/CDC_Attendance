import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { projectAPI } from '../../../services/api'

const ProjectForm = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const isEdit = Boolean(id)

  // Determine if we're in admin or teacher context
  const isAdminContext = location.pathname.startsWith('/admin')
  const basePath = isAdminContext ? '/admin' : ''

  const [loading, setLoading] = useState(false)
  const [finishedBatches, setFinishedBatches] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    batch: '',
    course: '',
    assignedDate: new Date().toISOString().split('T')[0],
    deadlineDate: '',
    requirements: [{ title: '', description: '', mandatory: true }],
    deliverables: [{ name: '', fileType: 'any', maxSize: 50, mandatory: true }],
    maxScore: 100,
    weightage: {
      projectScore: 70,
      attendanceScore: 20,
      submissionTiming: 10
    },
    instructions: '',
    resources: [{ title: '', url: '', description: '' }]
  })

  useEffect(() => {
    fetchFinishedBatches()
    if (isEdit) {
      fetchProject()
    }
  }, [id, isEdit])

  const fetchFinishedBatches = async () => {
    try {
      const response = await projectAPI.getFinishedBatches()
      setFinishedBatches(response.data)
    } catch (error) {
      console.error('Error fetching finished batches:', error)
      toast.error('Failed to fetch finished batches')
    }
  }

  const fetchProject = async () => {
    try {
      setLoading(true)
      const response = await projectAPI.getProject(id)
      const project = response.data
      
      setFormData({
        title: project.title,
        description: project.description,
        batch: project.batch._id,
        course: project.course._id,
        assignedDate: new Date(project.assignedDate).toISOString().split('T')[0],
        deadlineDate: new Date(project.deadlineDate).toISOString().split('T')[0],
        requirements: project.requirements.length > 0 ? project.requirements : [{ title: '', description: '', mandatory: true }],
        deliverables: project.deliverables.length > 0 ? project.deliverables : [{ name: '', fileType: 'any', maxSize: 50, mandatory: true }],
        maxScore: project.maxScore,
        weightage: project.weightage,
        instructions: project.instructions || '',
        resources: project.resources.length > 0 ? project.resources : [{ title: '', url: '', description: '' }]
      })
    } catch (error) {
      console.error('Error fetching project:', error)
      toast.error('Failed to fetch project details')
      navigate(`${basePath}/projects`)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.title.trim()) {
      toast.error('Please enter project title')
      return
    }
    
    if (!formData.description.trim()) {
      toast.error('Please enter project description')
      return
    }
    
    if (!formData.batch) {
      toast.error('Please select a batch')
      return
    }
    
    if (!formData.deadlineDate) {
      toast.error('Please set deadline date')
      return
    }

    // Check if deadline is after assigned date
    if (new Date(formData.deadlineDate) <= new Date(formData.assignedDate)) {
      toast.error('Deadline must be after assignment date')
      return
    }

    // Validate weightage totals to 100
    const totalWeightage = formData.weightage.projectScore + formData.weightage.attendanceScore + formData.weightage.submissionTiming
    if (totalWeightage !== 100) {
      toast.error('Weightage percentages must total 100%')
      return
    }

    try {
      setLoading(true)
      
      // Filter out empty requirements and deliverables
      const cleanedData = {
        ...formData,
        requirements: formData.requirements.filter(req => req.title.trim()),
        deliverables: formData.deliverables.filter(del => del.name.trim()),
        resources: formData.resources.filter(res => res.title.trim())
      }

      if (isEdit) {
        await projectAPI.updateProject(id, cleanedData)
        toast.success('Project updated successfully')
      } else {
        await projectAPI.createProject(cleanedData)
        toast.success('Project assigned successfully')
      }
      
      navigate(`${basePath}/projects`)
    } catch (error) {
      console.error('Error saving project:', error)
      toast.error(error.response?.data?.message || 'Failed to save project')
    } finally {
      setLoading(false)
    }
  }

  const handleBatchChange = (batchId) => {
    const selectedBatch = finishedBatches.find(batch => batch._id === batchId)
    setFormData({
      ...formData,
      batch: batchId,
      course: selectedBatch ? selectedBatch.course._id : ''
    })
  }

  const addRequirement = () => {
    setFormData({
      ...formData,
      requirements: [...formData.requirements, { title: '', description: '', mandatory: true }]
    })
  }

  const removeRequirement = (index) => {
    const newRequirements = formData.requirements.filter((_, i) => i !== index)
    setFormData({ ...formData, requirements: newRequirements })
  }

  const updateRequirement = (index, field, value) => {
    const newRequirements = [...formData.requirements]
    newRequirements[index] = { ...newRequirements[index], [field]: value }
    setFormData({ ...formData, requirements: newRequirements })
  }

  const addDeliverable = () => {
    setFormData({
      ...formData,
      deliverables: [...formData.deliverables, { name: '', fileType: 'any', maxSize: 50, mandatory: true }]
    })
  }

  const removeDeliverable = (index) => {
    const newDeliverables = formData.deliverables.filter((_, i) => i !== index)
    setFormData({ ...formData, deliverables: newDeliverables })
  }

  const updateDeliverable = (index, field, value) => {
    const newDeliverables = [...formData.deliverables]
    newDeliverables[index] = { ...newDeliverables[index], [field]: value }
    setFormData({ ...formData, deliverables: newDeliverables })
  }

  const addResource = () => {
    setFormData({
      ...formData,
      resources: [...formData.resources, { title: '', url: '', description: '' }]
    })
  }

  const removeResource = (index) => {
    const newResources = formData.resources.filter((_, i) => i !== index)
    setFormData({ ...formData, resources: newResources })
  }

  const updateResource = (index, field, value) => {
    const newResources = [...formData.resources]
    newResources[index] = { ...newResources[index], [field]: value }
    setFormData({ ...formData, resources: newResources })
  }

  if (loading && isEdit) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Project' : 'Assign New Project'}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          {isEdit ? 'Update project details' : 'Assign a project to a finished batch'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        {/* Basic Information */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm sm:text-base"
                placeholder="Enter project title"
                required
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm sm:text-base resize-none"
                placeholder="Enter project description"
                required
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Finished Batch *
              </label>
              <select
                value={formData.batch}
                onChange={(e) => handleBatchChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm sm:text-base"
                required
                disabled={isEdit}
              >
                <option value="">Select a finished batch</option>
                {finishedBatches.map((batch) => (
                  <option key={batch._id} value={batch._id}>
                    {batch.name} - {batch.course?.name} ({batch.timing})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Score
              </label>
              <input
                type="number"
                value={formData.maxScore}
                onChange={(e) => setFormData({ ...formData, maxScore: parseInt(e.target.value) })}
                min="1"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assignment Date *
              </label>
              <input
                type="date"
                value={formData.assignedDate}
                onChange={(e) => setFormData({ ...formData, assignedDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm sm:text-base"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deadline Date *
              </label>
              <input
                type="date"
                value={formData.deadlineDate}
                onChange={(e) => setFormData({ ...formData, deadlineDate: e.target.value })}
                min={formData.assignedDate}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm sm:text-base"
                required
              />
            </div>
          </div>
        </div>

        {/* Continue with more sections... */}
        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate(`${basePath}/projects`)}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 order-1 sm:order-2"
          >
            {loading ? 'Saving...' : (isEdit ? 'Update Project' : 'Assign Project')}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProjectForm
