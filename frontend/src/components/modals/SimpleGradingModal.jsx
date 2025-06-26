import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { 
  XMarkIcon,
  StarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const SimpleGradingModal = ({ 
  isOpen, 
  onClose, 
  student,
  submission,
  maxScore = 100,
  onGradeSubmitted
}) => {
  const [grade, setGrade] = useState(submission?.grade || '')
  const [feedback, setFeedback] = useState(submission?.feedback || '')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!grade || grade < 0 || grade > maxScore) {
      toast.error(`Grade must be between 0 and ${maxScore}`)
      return
    }

    try {
      setSubmitting(true)
      await onGradeSubmitted(submission._id, {
        grade: parseFloat(grade),
        feedback: feedback.trim()
      })
      toast.success('Grade submitted successfully!')
      onClose()
    } catch (error) {
      console.error('Error submitting grade:', error)
      toast.error('Failed to submit grade')
    } finally {
      setSubmitting(false)
    }
  }

  const getGradeColor = () => {
    const percentage = (grade / maxScore) * 100
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 80) return 'text-blue-600'
    if (percentage >= 70) return 'text-yellow-600'
    if (percentage >= 60) return 'text-orange-600'
    return 'text-red-600'
  }

  const getGradeLetter = () => {
    const percentage = (grade / maxScore) * 100
    if (percentage >= 90) return 'A'
    if (percentage >= 80) return 'B'
    if (percentage >= 70) return 'C'
    if (percentage >= 60) return 'D'
    return 'F'
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Grade Submission
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Student Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium text-sm">
                        {student?.name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{student?.name}</h4>
                      <p className="text-xs text-gray-500">{student?.rollNo} • {student?.studentId}</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Grade Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grade (out of {maxScore})
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        min="0"
                        max={maxScore}
                        step="0.5"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={`Enter grade (0-${maxScore})`}
                        required
                      />
                      {grade && (
                        <div className="absolute right-3 top-2 flex items-center space-x-2">
                          <span className={`text-sm font-medium ${getGradeColor()}`}>
                            {getGradeLetter()}
                          </span>
                          <span className="text-xs text-gray-500">
                            {Math.round((grade / maxScore) * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Grade Buttons */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'A', value: maxScore * 0.95, color: 'bg-green-100 text-green-700' },
                      { label: 'B', value: maxScore * 0.85, color: 'bg-blue-100 text-blue-700' },
                      { label: 'C', value: maxScore * 0.75, color: 'bg-yellow-100 text-yellow-700' },
                      { label: 'D', value: maxScore * 0.65, color: 'bg-orange-100 text-orange-700' }
                    ].map((quick) => (
                      <button
                        key={quick.label}
                        type="button"
                        onClick={() => setGrade(quick.value)}
                        className={`px-3 py-2 rounded-md text-xs font-medium ${quick.color} hover:opacity-80 transition-opacity`}
                      >
                        {quick.label} ({quick.value})
                      </button>
                    ))}
                  </div>

                  {/* Feedback */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Feedback (Optional)
                    </label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter feedback for the student..."
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !grade}
                      className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                      {submitting ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <CheckCircleIcon className="h-4 w-4 mr-2" />
                          Submit Grade
                        </div>
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export default SimpleGradingModal
