import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { 
  ChartBarIcon, 
  TrophyIcon, 
  ClockIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { projectAPI } from '../../../services/api'

const ProjectAnalytics = () => {
  const { id } = useParams()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [id])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await projectAPI.getProjectAnalytics(id)
      setAnalytics(response.data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error('Failed to fetch project analytics')
    } finally {
      setLoading(false)
    }
  }

  const getGradeColor = (grade) => {
    const colors = {
      'A+': 'text-green-600 bg-green-100',
      'A': 'text-green-600 bg-green-100',
      'B+': 'text-blue-600 bg-blue-100',
      'B': 'text-blue-600 bg-blue-100',
      'C+': 'text-yellow-600 bg-yellow-100',
      'C': 'text-yellow-600 bg-yellow-100',
      'F': 'text-red-600 bg-red-100'
    }
    return colors[grade] || 'text-gray-600 bg-gray-100'
  }

  const StatCard = ({ title, value, subtitle, icon: Icon, color = 'text-gray-600' }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </div>
      </div>
    </div>
  )

  const ProgressBar = ({ label, value, total, color = 'bg-blue-500' }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0
    return (
      <div className="mb-4">
        <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
          <span>{label}</span>
          <span>{value}/{total} ({percentage.toFixed(1)}%)</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${color}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No analytics available</h3>
        <p className="mt-1 text-sm text-gray-500">Analytics data is not available for this project.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{analytics.project?.title}</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {analytics.batch?.name} - {analytics.batch?.timing}
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-2 space-y-1 sm:space-y-0 text-xs sm:text-sm text-gray-600">
              <span>Deadline: {format(new Date(analytics.project?.deadlineDate), 'MMM dd, yyyy')}</span>
              <span>Max Score: {analytics.project?.maxScore}</span>
            </div>
          </div>
          <div className="text-left sm:text-right flex-shrink-0">
            <p className="text-xs sm:text-sm text-gray-500">Last Updated</p>
            <p className="text-xs sm:text-sm font-medium text-gray-900">
              {format(new Date(analytics.lastUpdated), 'MMM dd, yyyy HH:mm')}
            </p>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Students"
          value={analytics.totalStudents}
          icon={UserGroupIcon}
          color="text-blue-600"
        />
        <StatCard
          title="Submissions"
          value={analytics.submittedCount}
          subtitle={`${analytics.submissionPercentage}% completion`}
          icon={AcademicCapIcon}
          color="text-green-600"
        />
        <StatCard
          title="Graded"
          value={analytics.gradedCount}
          subtitle={`${analytics.gradingPercentage}% graded`}
          icon={ChartBarIcon}
          color="text-purple-600"
        />
        <StatCard
          title="Average Score"
          value={analytics.finalScoreStats.average.toFixed(1)}
          subtitle="Final score average"
          icon={TrophyIcon}
          color="text-yellow-600"
        />
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Submission Progress */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Submission Progress</h2>
          <ProgressBar
            label="Submitted"
            value={analytics.submittedCount}
            total={analytics.totalStudents}
            color="bg-green-500"
          />
          <ProgressBar
            label="Pending"
            value={analytics.pendingCount}
            total={analytics.totalStudents}
            color="bg-yellow-500"
          />
          <ProgressBar
            label="Graded"
            value={analytics.gradedCount}
            total={analytics.submittedCount}
            color="bg-blue-500"
          />
        </div>

        {/* Submission Timing */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Submission Timing</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">Early Submissions</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{analytics.submissionStats.early}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">On-Time Submissions</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{analytics.submissionStats.onTime}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">Late Submissions</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{analytics.submissionStats.late}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">On-Time Rate</span>
              <span className="text-sm font-bold text-green-600">{analytics.onTimeSubmissionRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Score Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Grade Distribution</h2>
          <div className="space-y-3">
            {Object.entries({
              'A+': analytics.gradeDistribution.aPlus,
              'A': analytics.gradeDistribution.a,
              'B+': analytics.gradeDistribution.bPlus,
              'B': analytics.gradeDistribution.b,
              'C+': analytics.gradeDistribution.cPlus,
              'C': analytics.gradeDistribution.c,
              'F': analytics.gradeDistribution.f
            }).map(([grade, count]) => (
              <div key={grade} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGradeColor(grade)}`}>
                    {grade}
                  </span>
                  <span className="ml-3 text-sm font-medium text-gray-700">Grade {grade}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{count} students</span>
              </div>
            ))}
          </div>
        </div>

        {/* Score Statistics */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Score Statistics</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Project Score</p>
                <p className="text-lg font-bold text-gray-900">{analytics.scoreStats.average.toFixed(1)}</p>
                <p className="text-xs text-gray-600">Average</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Attendance Score</p>
                <p className="text-lg font-bold text-gray-900">{analytics.attendanceStats.average.toFixed(1)}</p>
                <p className="text-xs text-gray-600">Average</p>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm font-medium text-gray-500">Highest</p>
                  <p className="text-lg font-bold text-green-600">{analytics.finalScoreStats.highest}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Average</p>
                  <p className="text-lg font-bold text-blue-600">{analytics.finalScoreStats.average.toFixed(1)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Lowest</p>
                  <p className="text-lg font-bold text-red-600">{analytics.finalScoreStats.lowest}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      {analytics.topPerformers && analytics.topPerformers.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Final Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.topPerformers.map((performer, index) => {
                  const grade = performer.finalScore >= 90 ? 'A+' :
                               performer.finalScore >= 80 ? 'A' :
                               performer.finalScore >= 70 ? 'B+' :
                               performer.finalScore >= 60 ? 'B' :
                               performer.finalScore >= 50 ? 'C+' :
                               performer.finalScore >= 40 ? 'C' : 'F'
                  
                  return (
                    <tr key={performer.student._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {index === 0 && <TrophyIcon className="h-5 w-5 text-yellow-500 mr-2" />}
                          <span className="text-sm font-medium text-gray-900">#{performer.rank}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{performer.student.name}</div>
                        <div className="text-sm text-gray-500">{performer.student.rollNo}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {performer.student.studentId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {performer.finalScore.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGradeColor(grade)}`}>
                          {grade}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectAnalytics
