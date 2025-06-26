import { useState, useEffect } from 'react'
import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentCheckIcon,
  TrophyIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'
import { projectAPI } from '../../services/api'

const ProjectCompletionModal = ({ isOpen, onClose, projectId, onComplete }) => {
  const [completionStatus, setCompletionStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [completionNotes, setCompletionNotes] = useState('')

  useEffect(() => {
    if (isOpen && projectId) {
      fetchCompletionStatus()
    }
  }, [isOpen, projectId])

  const fetchCompletionStatus = async () => {
    try {
      setLoading(true)
      const response = await projectAPI.getProjectCompletionStatus(projectId)
      setCompletionStatus(response.data)
    } catch (error) {
      console.error('Error fetching completion status:', error)
      toast.error('Failed to fetch project completion status')
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async () => {
    try {
      setCompleting(true)
      const response = await projectAPI.completeProject(projectId, {
        completionNotes: completionNotes.trim()
      })
      
      toast.success('Project completed successfully!')
      onComplete(response.data)
      onClose()
    } catch (error) {
      console.error('Error completing project:', error)
      toast.error(error.response?.data?.message || 'Failed to complete project')
    } finally {
      setCompleting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <TrophyIcon className="h-6 w-6 text-yellow-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Complete Project</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : completionStatus ? (
          <div className="space-y-6">
            {/* Project Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">{completionStatus.project.title}</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Current Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    completionStatus.project.status === 'completed' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {completionStatus.project.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Deadline:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(completionStatus.project.deadlineDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <UserGroupIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">
                  {completionStatus.statistics.totalStudents}
                </div>
                <div className="text-xs text-blue-800">Total Students</div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <DocumentCheckIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">
                  {completionStatus.statistics.totalSubmissions}
                </div>
                <div className="text-xs text-green-800">Submissions</div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <CheckCircleIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">
                  {completionStatus.statistics.gradedSubmissions}
                </div>
                <div className="text-xs text-purple-800">Graded</div>
              </div>
              
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <ClockIcon className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-600">
                  {completionStatus.statistics.pendingSubmissions}
                </div>
                <div className="text-xs text-orange-800">Pending</div>
              </div>
            </div>

            {/* Completion Criteria */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 mb-3">Completion Criteria</h5>
              <div className="space-y-2">
                {Object.entries({
                  'Has Submissions': completionStatus.completionCriteria.hasSubmissions,
                  'All Submissions Graded': completionStatus.completionCriteria.allGraded,
                  'Not Already Completed': completionStatus.completionCriteria.notAlreadyCompleted,
                  'Not Archived': completionStatus.completionCriteria.notArchived
                }).map(([criteria, met]) => (
                  <div key={criteria} className="flex items-center">
                    {met ? (
                      <CheckCircleIconSolid className="h-5 w-5 text-green-500 mr-2" />
                    ) : (
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                    )}
                    <span className={`text-sm ${met ? 'text-green-700' : 'text-red-700'}`}>
                      {criteria}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Completion Notes */}
            {completionStatus.canComplete && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Completion Notes (Optional)
                </label>
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Add any notes about the project completion..."
                  maxLength={500}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {completionNotes.length}/500 characters
                </div>
              </div>
            )}

            {/* Warning/Info Messages */}
            {!completionStatus.canComplete && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <InformationCircleIcon className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" />
                  <div>
                    <h6 className="text-sm font-medium text-yellow-800">Cannot Complete Project</h6>
                    <p className="text-sm text-yellow-700 mt-1">
                      {completionStatus.statistics.pendingSubmissions > 0 
                        ? `There are ${completionStatus.statistics.pendingSubmissions} ungraded submissions. Please grade all submissions before completing the project.`
                        : completionStatus.statistics.totalSubmissions === 0
                        ? 'No submissions have been received for this project.'
                        : 'Project completion criteria not met.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              {completionStatus.canComplete && (
                <button
                  onClick={handleComplete}
                  disabled={completing}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  {completing ? 'Completing...' : 'Complete Project'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Failed to load completion status</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectCompletionModal
