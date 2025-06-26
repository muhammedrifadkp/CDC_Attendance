import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeftIcon,
  ChartBarIcon,
  TrophyIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { projectAPI } from '../../../services/api'

const SimpleProjectAnalytics = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  
  const [project, setProject] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (projectId) {
      fetchAnalytics()
    }
  }, [projectId])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      
      // Fetch project details and analytics
      const [projectResponse, analyticsResponse] = await Promise.all([
        projectAPI.getProject(projectId),
        projectAPI.getProjectAnalytics(projectId)
      ])
      
      setProject(projectResponse.data)
      setAnalytics(analyticsResponse.data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error('Failed to fetch project analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!project || !analytics) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Analytics not available</h3>
        <p className="mt-1 text-sm text-gray-500">Unable to load project analytics.</p>
      </div>
    )
  }

  const submissionRate = analytics.totalStudents > 0 
    ? Math.round((analytics.submittedCount / analytics.totalStudents) * 100)
    : 0

  const averageGrade = analytics.gradedSubmissions > 0
    ? Math.round(analytics.totalGrades / analytics.gradedSubmissions)
    : 0

  const onTimeSubmissions = analytics.submittedCount > 0
    ? Math.round((analytics.onTimeSubmissions / analytics.submittedCount) * 100)
    : 0

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/projects')}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Project Analytics</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            {project.title}
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Submission Rate</p>
              <p className="text-2xl font-bold text-gray-900">{submissionRate}%</p>
              <p className="text-xs text-gray-500">{analytics.submittedCount}/{analytics.totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <TrophyIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Average Grade</p>
              <p className="text-2xl font-bold text-gray-900">{averageGrade}</p>
              <p className="text-xs text-gray-500">out of {project.maxScore}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">On-Time Rate</p>
              <p className="text-2xl font-bold text-gray-900">{onTimeSubmissions}%</p>
              <p className="text-xs text-gray-500">{analytics.onTimeSubmissions} on time</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submission Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Submission Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Submitted</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${submissionRate}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">{analytics.submittedCount}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Pending</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                  <div 
                    className="bg-yellow-600 h-2 rounded-full" 
                    style={{ width: `${100 - submissionRate}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">{analytics.totalStudents - analytics.submittedCount}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Graded</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${analytics.submittedCount > 0 ? (analytics.gradedSubmissions / analytics.submittedCount) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">{analytics.gradedSubmissions}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Grade Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade Distribution</h3>
          <div className="space-y-3">
            {analytics.gradeDistribution && Object.entries(analytics.gradeDistribution).map(([grade, count]) => (
              <div key={grade} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Grade {grade}</span>
                <div className="flex items-center">
                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                    <div 
                      className={`h-2 rounded-full ${
                        grade === 'A' ? 'bg-green-600' :
                        grade === 'B' ? 'bg-blue-600' :
                        grade === 'C' ? 'bg-yellow-600' :
                        grade === 'D' ? 'bg-orange-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${analytics.gradedSubmissions > 0 ? (count / analytics.gradedSubmissions) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Project Timeline */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Timeline</h3>
        <div className="space-y-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 w-3 h-3 bg-blue-600 rounded-full"></div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">Project Assigned</p>
              <p className="text-xs text-gray-500">{format(new Date(project.assignedDate), 'MMMM dd, yyyy')}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="flex-shrink-0 w-3 h-3 bg-yellow-600 rounded-full"></div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">Deadline</p>
              <p className="text-xs text-gray-500">{format(new Date(project.deadlineDate), 'MMMM dd, yyyy')}</p>
            </div>
          </div>

          {project.status === 'completed' && (
            <div className="flex items-center">
              <div className="flex-shrink-0 w-3 h-3 bg-green-600 rounded-full"></div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Project Completed</p>
                <p className="text-xs text-gray-500">{format(new Date(project.completedDate), 'MMMM dd, yyyy')}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
        <button
          onClick={() => navigate(`/projects/${projectId}/manage`)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Manage Project
        </button>
        <button
          onClick={() => navigate(`/projects/${projectId}/submissions`)}
          className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
        >
          View Submissions
        </button>
      </div>
    </div>
  )
}

export default SimpleProjectAnalytics
