import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeftIcon,
  CheckCircleIcon,
  XMarkIcon,
  UserIcon,
  CalendarIcon,
  TrophyIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { projectAPI, studentsAPI } from '../../../services/api'
import ConfirmationModal from '../../../components/modals/ConfirmationModal'
import SimpleGradingModal from '../../../components/modals/SimpleGradingModal'

const SimpleProjectManage = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  
  const [project, setProject] = useState(null)
  const [students, setStudents] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [completeModal, setCompleteModal] = useState({
    isOpen: false,
    submittedCount: 0,
    totalCount: 0,
    needsForceComplete: false,
    ungradedCount: 0
  })
  const [gradingModal, setGradingModal] = useState({
    isOpen: false,
    student: null,
    submission: null
  })

  useEffect(() => {
    if (projectId) {
      fetchData()
    }
  }, [projectId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [projectResponse, submissionsResponse] = await Promise.all([
        projectAPI.getProject(projectId),
        projectAPI.getProjectSubmissions(projectId)
      ])

      setProject(projectResponse.data)
      setSubmissions(submissionsResponse.data)

      // Fetch students from batch
      if (projectResponse.data.batch?._id) {
        const studentsResponse = await studentsAPI.getStudentsByBatch(projectResponse.data.batch._id)
        setStudents(studentsResponse.data || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to fetch project details')
    } finally {
      setLoading(false)
    }
  }

  const getStudentSubmissionData = () => {
    return students.map(student => {
      const submission = submissions.find(sub => sub.student?._id === student._id)
      return {
        ...student,
        submission,
        hasSubmitted: !!submission
      }
    })
  }

  const toggleSubmission = async (student) => {
    try {
      setUpdating(true)
      
      if (student.hasSubmitted) {
        // Remove submission (mark as not submitted)
        await projectAPI.removeSubmission(student.submission._id)
        toast.success(`${student.name} marked as not submitted`)
      } else {
        // Add submission
        const formData = new FormData()
        formData.append('studentId', student._id)
        formData.append('description', 'Marked as submitted by teacher')
        formData.append('notes', 'Manual submission entry')
        
        await projectAPI.submitProject(projectId, formData)
        toast.success(`${student.name} marked as submitted`)
      }
      
      fetchData() // Refresh data
    } catch (error) {
      console.error('Error updating submission:', error)
      toast.error('Failed to update submission status')
    } finally {
      setUpdating(false)
    }
  }

  const openCompleteModal = () => {
    const studentData = getStudentSubmissionData()
    const submittedCount = studentData.filter(s => s.hasSubmitted).length
    const totalCount = studentData.length

    if (submittedCount === 0) {
      toast.error('No students have submitted yet')
      return
    }

    setCompleteModal({
      isOpen: true,
      submittedCount,
      totalCount
    })
  }

  const closeCompleteModal = () => {
    setCompleteModal({
      isOpen: false,
      submittedCount: 0,
      totalCount: 0,
      needsForceComplete: false,
      ungradedCount: 0
    })
  }

  const completeProject = async (forceComplete = false) => {
    try {
      setUpdating(true)
      await projectAPI.completeProject(projectId, {
        completionNotes: 'Project completed by teacher',
        forceComplete: forceComplete
      })
      toast.success('Project completed successfully!')
      closeCompleteModal()
      navigate('/projects')
    } catch (error) {
      console.error('Error completing project:', error)
      const errorMessage = error.response?.data?.message || 'Failed to complete project'

      // Check if it's an ungraded submissions error
      if (errorMessage.includes('ungraded submissions')) {
        const ungradedCount = errorMessage.match(/(\d+) ungraded/)?.[1] || 0
        setCompleteModal(prev => ({
          ...prev,
          needsForceComplete: true,
          ungradedCount: parseInt(ungradedCount)
        }))
        return // Don't close modal, show force complete option
      }

      toast.error(errorMessage)
      closeCompleteModal()
    } finally {
      setUpdating(false)
    }
  }

  const openGradingModal = (student) => {
    const submission = submissions.find(sub => sub.student?._id === student._id)
    setGradingModal({
      isOpen: true,
      student,
      submission
    })
  }

  const closeGradingModal = () => {
    setGradingModal({
      isOpen: false,
      student: null,
      submission: null
    })
  }

  const handleGradeSubmission = async (submissionId, gradeData) => {
    await projectAPI.gradeSubmission(submissionId, gradeData)
    fetchData() // Refresh data
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  const studentData = getStudentSubmissionData()
  const submittedCount = studentData.filter(s => s.hasSubmitted).length
  const totalCount = studentData.length
  const completionRate = totalCount > 0 ? Math.round((submittedCount / totalCount) * 100) : 0

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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Manage Project</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Track and manage student submissions
          </p>
        </div>
      </div>

      {/* Project Info */}
      {project && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{project.title}</h2>
              <p className="text-sm text-gray-600 mt-1">{project.batch?.name}</p>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center text-gray-600">
                <CalendarIcon className="h-4 w-4 mr-1" />
                Deadline: {format(new Date(project.deadlineDate), 'MMM dd, yyyy')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <UserIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-900">Total Students</p>
              <p className="text-2xl font-bold text-blue-600">{totalCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-900">Submitted</p>
              <p className="text-2xl font-bold text-green-600">{submittedCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <TrophyIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-purple-900">Completion</p>
              <p className="text-2xl font-bold text-purple-600">{completionRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Student Submissions</h3>
          <p className="text-sm text-gray-600 mt-1">
            Mark students as submitted or not submitted
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {studentData.map((student) => (
            <div key={student._id} className="px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center flex-1">
                <div className="flex-shrink-0 h-10 w-10">
                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-gray-600" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="text-sm font-medium text-gray-900">{student.name}</div>
                  <div className="text-sm text-gray-500">{student.rollNo} • {student.studentId}</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {student.hasSubmitted ? (
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center text-green-600">
                      <CheckCircleIcon className="h-5 w-5 mr-1" />
                      <span className="text-sm font-medium">Submitted</span>
                    </div>
                    {student.submission?.grade && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {student.submission.grade}/{project?.maxScore || 100}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center text-gray-400">
                    <XMarkIcon className="h-5 w-5 mr-1" />
                    <span className="text-sm">Not Submitted</span>
                  </div>
                )}

                <div className="flex space-x-2">
                  {student.hasSubmitted && (
                    <button
                      onClick={() => openGradingModal(student)}
                      className="px-3 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                    >
                      {student.submission?.grade ? 'Edit Grade' : 'Grade'}
                    </button>
                  )}
                  <button
                    onClick={() => toggleSubmission(student)}
                    disabled={updating}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      student.hasSubmitted
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    } disabled:opacity-50`}
                  >
                    {student.hasSubmitted ? 'Mark Not Submitted' : 'Mark Submitted'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Complete Project */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Complete Project</h3>
            <p className="text-sm text-gray-600 mt-1">
              Mark this project as completed when all submissions are done
            </p>
          </div>
          <button
            onClick={openCompleteModal}
            disabled={updating || submittedCount === 0}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            {updating ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Completing...
              </div>
            ) : (
              <div className="flex items-center">
                <TrophyIcon className="h-4 w-4 mr-2" />
                Complete Project
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Complete Project Confirmation Modal */}
      <ConfirmationModal
        isOpen={completeModal.isOpen}
        onClose={closeCompleteModal}
        onConfirm={() => completeProject(completeModal.needsForceComplete)}
        title={completeModal.needsForceComplete ? "Force Complete Project" : "Complete Project"}
        message={
          completeModal.needsForceComplete
            ? `This project has ${completeModal.ungradedCount} ungraded submission(s). Force completing will automatically assign 80% score to ungraded submissions. You can adjust grades later if needed. Do you want to proceed?`
            : completeModal.submittedCount < completeModal.totalCount
            ? `Only ${completeModal.submittedCount} out of ${completeModal.totalCount} students have submitted. Are you sure you want to complete the project? Students who haven't submitted will not be able to submit after completion.`
            : `All ${completeModal.totalCount} students have submitted their projects. Ready to mark this project as completed?`
        }
        confirmText={completeModal.needsForceComplete ? "Force Complete" : "Complete Project"}
        cancelText="Cancel"
        type={
          completeModal.needsForceComplete ? "warning" :
          completeModal.submittedCount < completeModal.totalCount ? "warning" : "success"
        }
        loading={updating}
        icon={TrophyIcon}
      />

      {/* Grading Modal */}
      <SimpleGradingModal
        isOpen={gradingModal.isOpen}
        onClose={closeGradingModal}
        student={gradingModal.student}
        submission={gradingModal.submission}
        maxScore={project?.maxScore || 100}
        onGradeSubmitted={handleGradeSubmission}
      />
    </div>
  )
}

export default SimpleProjectManage
