import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { 
  DocumentTextIcon, 
  CalendarIcon, 
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { projectAPI } from '../../services/api'

const StudentProjects = () => {
  const { studentId } = useParams()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStudentProjects()
  }, [studentId])

  const fetchStudentProjects = async () => {
    try {
      setLoading(true)
      const response = await projectAPI.getStudentProjects(studentId)
      setProjects(response.data)
    } catch (error) {
      console.error('Error fetching student projects:', error)
      toast.error('Failed to fetch projects')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (project) => {
    if (project.hasSubmitted) {
      const statusConfig = {
        submitted: { color: 'bg-blue-100 text-blue-800', text: 'Submitted' },
        under_review: { color: 'bg-yellow-100 text-yellow-800', text: 'Under Review' },
        graded: { color: 'bg-green-100 text-green-800', text: 'Graded' },
        returned: { color: 'bg-orange-100 text-orange-800', text: 'Returned' },
        resubmitted: { color: 'bg-purple-100 text-purple-800', text: 'Resubmitted' }
      }
      
      const config = statusConfig[project.submissionStatus] || statusConfig.submitted
      
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
          {config.text}
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Not Submitted
        </span>
      )
    }
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

  const getDeadlineIcon = (deadlineDate) => {
    const now = new Date()
    const deadline = new Date(deadlineDate)
    const diffTime = deadline - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
    } else if (diffDays <= 3) {
      return <ClockIcon className="h-5 w-5 text-yellow-600" />
    } else {
      return <CheckCircleIcon className="h-5 w-5 text-green-600" />
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
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Projects</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">View and submit your assigned projects</p>
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <DocumentTextIcon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
          <h3 className="mt-2 text-sm sm:text-base font-medium text-gray-900">No projects assigned</h3>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 max-w-sm mx-auto">
            You don't have any projects assigned yet. Check back later.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {projects.map((project) => (
            <div key={project._id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
              <div className="p-4 sm:p-6">
                <div className="flex flex-col space-y-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0 mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 truncate">
                      {project.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                      {project.description}
                    </p>
                  </div>
                  <div className="flex-shrink-0 self-start">
                    {getStatusBadge(project)}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    <span>Assigned: {format(new Date(project.assignedDate), 'MMM dd, yyyy')}</span>
                  </div>

                  <div className="flex items-center text-sm">
                    {getDeadlineIcon(project.deadlineDate)}
                    <span className="ml-2">Deadline: {format(new Date(project.deadlineDate), 'MMM dd, yyyy')}</span>
                  </div>

                  <div className="text-sm">
                    {getDaysRemaining(project.deadlineDate)}
                  </div>

                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Max Score:</span> {project.maxScore} points
                  </div>

                  {project.submission && (
                    <div className="pt-3 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Submitted:</span> {format(new Date(project.submission.submittedDate), 'MMM dd, yyyy')}
                      </div>
                      {project.submission.score !== null && (
                        <div className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Score:</span> {project.submission.score}/{project.maxScore}
                        </div>
                      )}
                      {project.submission.finalScore !== null && (
                        <div className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Final Score:</span> {project.submission.finalScore.toFixed(1)}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className="flex space-x-2">
                    <Link
                      to={`/projects/${project._id}`}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <EyeIcon className="h-3 w-3 mr-1" />
                      View Details
                    </Link>
                  </div>

                  <div className="flex space-x-2">
                    {!project.hasSubmitted && (
                      <Link
                        to={`/student/${studentId}/projects/${project._id}/submit`}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700"
                      >
                        <DocumentArrowUpIcon className="h-3 w-3 mr-1" />
                        Submit
                      </Link>
                    )}
                    
                    {project.hasSubmitted && project.submissionStatus === 'returned' && (
                      <Link
                        to={`/student/${studentId}/projects/${project._id}/submit`}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-orange-600 hover:bg-orange-700"
                      >
                        <DocumentArrowUpIcon className="h-3 w-3 mr-1" />
                        Resubmit
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {projects.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{projects.length}</div>
              <div className="text-sm text-gray-600">Total Projects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {projects.filter(p => p.hasSubmitted).length}
              </div>
              <div className="text-sm text-gray-600">Submitted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {projects.filter(p => !p.hasSubmitted).length}
              </div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {projects.filter(p => p.submission && p.submission.finalScore !== null).length}
              </div>
              <div className="text-sm text-gray-600">Graded</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentProjects
