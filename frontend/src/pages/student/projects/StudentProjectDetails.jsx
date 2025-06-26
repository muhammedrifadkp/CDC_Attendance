import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  EyeIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { format, isAfter, differenceInDays } from 'date-fns'
import toast from 'react-hot-toast'
import { projectAPI } from '../../../services/api'

const StudentProjectDetails = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)

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

  const downloadFile = async (submissionId, fileName) => {
    try {
      const response = await projectAPI.downloadSubmissionFile(submissionId, fileName)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading file:', error)
      toast.error('Failed to download file')
    }
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
  const hasSubmission = project.submissions && project.submissions.length > 0
  const submission = hasSubmission ? project.submissions[0] : null

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/projects')}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{project.title}</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Project Details and Submission Status
          </p>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`rounded-lg p-4 ${
        hasSubmission && submission.grade !== null && submission.grade !== undefined
          ? 'bg-green-50 border border-green-200'
          : hasSubmission
          ? 'bg-blue-50 border border-blue-200'
          : isOverdue
          ? 'bg-red-50 border border-red-200'
          : daysLeft <= 3
          ? 'bg-yellow-50 border border-yellow-200'
          : 'bg-gray-50 border border-gray-200'
      }`}>
        <div className="flex items-center">
          {hasSubmission && submission.grade !== null && submission.grade !== undefined ? (
            <>
              <TrophyIcon className="h-6 w-6 text-green-600 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-green-900">Project Graded</h3>
                <p className="text-green-700">
                  Your submission has been graded: {submission.grade}/{project.maxScore}
                </p>
              </div>
            </>
          ) : hasSubmission ? (
            <>
              <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-blue-900">Project Submitted</h3>
                <p className="text-blue-700">
                  Submitted on {format(new Date(submission.submittedDate), 'MMMM dd, yyyy')} - Awaiting grade
                </p>
              </div>
            </>
          ) : isOverdue ? (
            <>
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-red-900">Submission Overdue</h3>
                <p className="text-red-700">
                  The deadline was {format(deadline, 'MMMM dd, yyyy')}
                </p>
              </div>
            </>
          ) : (
            <>
              <ClockIcon className="h-6 w-6 text-yellow-600 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-yellow-900">
                  {daysLeft <= 3 ? 'Due Soon' : 'Pending Submission'}
                </h3>
                <p className="text-yellow-700">
                  Due {format(deadline, 'MMMM dd, yyyy')} 
                  {daysLeft > 0 && ` (${daysLeft} days left)`}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{project.description}</p>
          </div>

          {/* Requirements */}
          {project.requirements && project.requirements.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h2>
              <ul className="space-y-2">
                {project.requirements.map((req, index) => (
                  <li key={index} className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="font-medium text-gray-900">{req.title}</h4>
                      {req.description && (
                        <p className="text-gray-600 text-sm mt-1">{req.description}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Instructions */}
          {project.instructions && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Instructions</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{project.instructions}</p>
            </div>
          )}

          {/* My Submission */}
          {hasSubmission && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">My Submission</h2>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700">{submission.description}</p>
                </div>

                {submission.notes && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                    <p className="text-gray-700">{submission.notes}</p>
                  </div>
                )}

                {submission.files && submission.files.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Submitted Files</h4>
                    <div className="space-y-2">
                      {submission.files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div className="flex items-center">
                            <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{file.originalName}</span>
                          </div>
                          <button
                            onClick={() => downloadFile(submission._id, file.originalName)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4 inline mr-1" />
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {submission.feedback && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Teacher Feedback</h4>
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                      <p className="text-blue-800">{submission.feedback}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Info</h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-600">Assigned:</span>
                <span className="ml-2 font-medium">{format(new Date(project.assignedDate), 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex items-center text-sm">
                <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-600">Deadline:</span>
                <span className="ml-2 font-medium">{format(deadline, 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex items-center text-sm">
                <TrophyIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-600">Max Score:</span>
                <span className="ml-2 font-medium">{project.maxScore} points</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-3">
              {!hasSubmission && !isOverdue && (
                <Link
                  to={`/projects/${project._id}/submit`}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Submit Project
                </Link>
              )}
              
              {hasSubmission && (
                <div className="text-center p-4 bg-green-50 rounded-md">
                  <CheckCircleIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-green-800 font-medium">Project Submitted</p>
                  <p className="text-xs text-green-600 mt-1">
                    {format(new Date(submission.submittedDate), 'MMM dd, yyyy')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Grade */}
          {submission?.grade !== null && submission?.grade !== undefined && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade</h3>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {submission.grade}/{project.maxScore}
                </div>
                <div className="text-sm text-gray-600">
                  {Math.round((submission.grade / project.maxScore) * 100)}%
                </div>
                <div className="mt-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    (submission.grade / project.maxScore) >= 0.9 ? 'bg-green-100 text-green-800' :
                    (submission.grade / project.maxScore) >= 0.8 ? 'bg-blue-100 text-blue-800' :
                    (submission.grade / project.maxScore) >= 0.7 ? 'bg-yellow-100 text-yellow-800' :
                    (submission.grade / project.maxScore) >= 0.6 ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {(submission.grade / project.maxScore) >= 0.9 ? 'A' :
                     (submission.grade / project.maxScore) >= 0.8 ? 'B' :
                     (submission.grade / project.maxScore) >= 0.7 ? 'C' :
                     (submission.grade / project.maxScore) >= 0.6 ? 'D' : 'F'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StudentProjectDetails
