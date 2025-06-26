import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  ChartBarIcon, 
  DocumentTextIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  TrophyIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { projectAPI } from '../../../services/api'

const ProjectDashboard = () => {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const response = await projectAPI.getProjectDashboard()
      setDashboard(response.data)
    } catch (error) {
      console.error('Error fetching dashboard:', error)
      toast.error('Failed to fetch project dashboard')
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, subtitle, icon: Icon, color = 'text-gray-600', bgColor = 'bg-gray-50' }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-lg ${bgColor}`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="text-center py-12">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No dashboard data available</h3>
        <p className="mt-1 text-sm text-gray-500">Dashboard data could not be loaded.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Dashboard</h1>
          <p className="text-gray-600">Overview of all project activities and performance</p>
        </div>
        <Link
          to="/admin/projects/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
        >
          Assign New Project
        </Link>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Projects"
          value={dashboard.overview.totalProjects}
          icon={DocumentTextIcon}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          title="Total Students"
          value={dashboard.overview.totalStudents}
          icon={UserGroupIcon}
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <StatCard
          title="Submissions"
          value={dashboard.overview.totalSubmissions}
          subtitle={`${dashboard.overview.averageCompletionRate}% completion rate`}
          icon={AcademicCapIcon}
          color="text-purple-600"
          bgColor="bg-purple-50"
        />
        <StatCard
          title="Average Score"
          value={dashboard.overview.averageFinalScore.toFixed(1)}
          subtitle="Final score average"
          icon={TrophyIcon}
          color="text-yellow-600"
          bgColor="bg-yellow-50"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Graded Submissions"
          value={dashboard.overview.totalGraded}
          subtitle={`${dashboard.overview.totalSubmissions - dashboard.overview.totalGraded} pending`}
          icon={ChartBarIcon}
          color="text-indigo-600"
          bgColor="bg-indigo-50"
        />
        <StatCard
          title="Pending Grading"
          value={dashboard.overview.pendingGrading}
          subtitle="Submissions awaiting grades"
          icon={ClockIcon}
          color="text-orange-600"
          bgColor="bg-orange-50"
        />
        <StatCard
          title="Active Projects"
          value={dashboard.overview.totalProjects}
          subtitle="Currently running"
          icon={DocumentTextIcon}
          color="text-teal-600"
          bgColor="bg-teal-50"
        />
      </div>

      {/* Projects Needing Attention */}
      {dashboard.projectsNeedingAttention && dashboard.projectsNeedingAttention.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <ExclamationTriangleIcon className="h-5 w-5 text-orange-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Projects Needing Attention</h2>
          </div>
          <div className="space-y-3">
            {dashboard.projectsNeedingAttention.map((project) => (
              <div key={project._id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div>
                  <h3 className="font-medium text-gray-900">{project.title}</h3>
                  <p className="text-sm text-gray-600">{project.batch?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-orange-600">
                    Deadline: {format(new Date(project.deadlineDate), 'MMM dd, yyyy')}
                  </p>
                  <Link
                    to={`/admin/projects/${project._id}`}
                    className="text-sm text-orange-700 hover:text-orange-900"
                  >
                    View Project →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {dashboard.recentActivity && dashboard.recentActivity.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Submissions</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboard.recentActivity.map((submission) => (
                  <tr key={submission._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{submission.student?.name}</div>
                      <div className="text-sm text-gray-500">{submission.student?.rollNo}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{submission.project?.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(submission.submittedDate), 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        submission.status === 'graded' ? 'bg-green-100 text-green-800' :
                        submission.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {submission.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Latest Project Analytics */}
      {dashboard.analytics && dashboard.analytics.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Latest Project Analytics</h2>
            <Link
              to="/admin/projects"
              className="text-sm text-red-600 hover:text-red-800"
            >
              View All Projects →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboard.analytics.slice(0, 6).map((analytic) => (
              <div key={analytic._id} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">{analytic.project?.title}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completion:</span>
                    <span className="font-medium">{analytic.completionRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Score:</span>
                    <span className="font-medium">{analytic.finalScoreStats.average.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">On-Time Rate:</span>
                    <span className="font-medium">{analytic.onTimeSubmissionRate}%</span>
                  </div>
                </div>
                <div className="mt-3">
                  <Link
                    to={`/admin/projects/${analytic.project._id}/analytics`}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    View Analytics →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectDashboard
