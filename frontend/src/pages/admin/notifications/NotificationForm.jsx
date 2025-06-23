import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { notificationsAPI, departmentsAPI, teachersAPI } from '../../../services/api'
import BackButton from '../../../components/BackButton'
import {
  SpeakerWaveIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CalendarDaysIcon,
  MegaphoneIcon,
  EnvelopeIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  UsersIcon
} from '@heroicons/react/24/outline'

const NotificationForm = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState([])
  const [teachers, setTeachers] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    priority: 'medium',
    targetAudience: 'all_teachers',
    targetTeachers: [],
    targetDepartment: '',
    sendEmail: true
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchDepartments()
    fetchTeachers()
  }, [])

  const fetchDepartments = async () => {
    try {
      const response = await departmentsAPI.getDepartments({ active: true })
      setDepartments(response.data || [])
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }

  const fetchTeachers = async () => {
    try {
      const response = await teachersAPI.getTeachers()
      setTeachers(response.data || [])
    } catch (error) {
      console.error('Error fetching teachers:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleTeacherSelection = (teacherId) => {
    setFormData(prev => ({
      ...prev,
      targetTeachers: prev.targetTeachers.includes(teacherId)
        ? prev.targetTeachers.filter(id => id !== teacherId)
        : [...prev.targetTeachers, teacherId]
    }))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be 200 characters or less'
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required'
    } else if (formData.message.length > 2000) {
      newErrors.message = 'Message must be 2000 characters or less'
    }

    if (formData.targetAudience === 'specific_teachers' && formData.targetTeachers.length === 0) {
      newErrors.targetTeachers = 'Please select at least one teacher'
    }

    if (formData.targetAudience === 'department' && !formData.targetDepartment) {
      newErrors.targetDepartment = 'Please select a department'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    setLoading(true)
    try {
      const response = await notificationsAPI.createNotification(formData)
      
      if (response.data.success) {
        const { emailResults } = response.data
        if (formData.sendEmail) {
          toast.success(
            `Notification sent successfully! ${emailResults.sent}/${emailResults.total} emails delivered.`
          )
        } else {
          toast.success('Notification created successfully!')
        }
        navigate('/admin/notifications')
      }
    } catch (error) {
      console.error('Error creating notification:', error)
      toast.error(error.response?.data?.message || 'Failed to create notification')
    } finally {
      setLoading(false)
    }
  }

  const typeOptions = [
    { value: 'info', label: 'Information', icon: InformationCircleIcon, color: 'text-blue-600' },
    { value: 'announcement', label: 'Announcement', icon: MegaphoneIcon, color: 'text-green-600' },
    { value: 'warning', label: 'Warning', icon: ExclamationTriangleIcon, color: 'text-yellow-600' },
    { value: 'urgent', label: 'Urgent', icon: SpeakerWaveIcon, color: 'text-red-600' },
    { value: 'leave', label: 'Leave Notice', icon: CalendarDaysIcon, color: 'text-purple-600' }
  ]

  const priorityOptions = [
    { value: 'low', label: 'Low Priority', color: 'text-gray-600' },
    { value: 'medium', label: 'Medium Priority', color: 'text-blue-600' },
    { value: 'high', label: 'High Priority', color: 'text-orange-600' },
    { value: 'urgent', label: 'Urgent Priority', color: 'text-red-600' }
  ]

  const audienceOptions = [
    { value: 'all_teachers', label: 'All Teachers', icon: UserGroupIcon },
    { value: 'department', label: 'Specific Department', icon: BuildingOfficeIcon },
    { value: 'specific_teachers', label: 'Specific Teachers', icon: UsersIcon }
  ]

  return (
    <div className="space-y-4 md:space-y-6">
  {/* Header - Stacked on mobile */}
  <div className="flex items-start md:items-center space-x-3 md:space-x-4">
    <BackButton className="mt-1 md:mt-0" />
    <div>
      <h1 className="text-xl md:text-2xl font-bold text-gray-900">Send Notification to Teachers</h1>
      <p className="text-sm md:text-base text-gray-600">
        Create and send notifications to teachers via dashboard and email
      </p>
    </div>
  </div>

  {/* Form - Adjusted padding and spacing for mobile */}
  <div className="bg-white rounded-xl md:rounded-2xl shadow-lg overflow-hidden">
    <div className="px-4 py-3 md:px-6 md:py-4 bg-gradient-to-r from-cadd-red to-cadd-pink">
      <div className="flex items-center space-x-2 md:space-x-3">
        <SpeakerWaveIcon className="h-5 w-5 md:h-6 md:w-6 text-white" />
        <h2 className="text-base md:text-lg font-semibold text-white">Notification Details</h2>
      </div>
    </div>

    <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-6 md:space-y-8">
      {/* Basic Information */}
      <div className="space-y-4 md:space-y-6">
        <h3 className="text-base md:text-lg font-medium text-gray-900 border-b pb-2">Message Content</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="md:col-span-2">
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
              Notification Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full px-3 py-2 text-sm md:text-base border rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Tomorrow is Holiday - Institute Closed"
              maxLength="200"
            />
            {errors.title && <p className="text-red-500 text-xs md:text-sm mt-1">{errors.title}</p>}
            <p className="text-gray-500 text-xs md:text-sm mt-1">{formData.title.length}/200 characters</p>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
              Notification Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent"
            >
              {typeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
              Priority Level
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent"
            >
              {priorityOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
              Message Content *
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows="4"
              className={`w-full px-3 py-2 text-sm md:text-base border rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent ${
                errors.message ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter the detailed message for teachers..."
              maxLength="2000"
            />
            {errors.message && <p className="text-red-500 text-xs md:text-sm mt-1">{errors.message}</p>}
            <p className="text-gray-500 text-xs md:text-sm mt-1">{formData.message.length}/2000 characters</p>
          </div>
        </div>
      </div>

      {/* Target Audience */}
      <div className="space-y-4 md:space-y-6">
        <h3 className="text-base md:text-lg font-medium text-gray-900 border-b pb-2">Target Audience</h3>

        <div>
          <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2 md:mb-3">
            Send notification to:
          </label>
          <div className="space-y-2 md:space-y-3">
            {audienceOptions.map(option => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name="targetAudience"
                  value={option.value}
                  checked={formData.targetAudience === option.value}
                  onChange={handleChange}
                  className="h-4 w-4 text-cadd-red focus:ring-cadd-red border-gray-300"
                />
                <div className="ml-2 md:ml-3 flex items-center">
                  <option.icon className="h-4 w-4 md:h-5 md:w-5 text-gray-400 mr-1 md:mr-2" />
                  <span className="text-xs md:text-sm font-medium text-gray-700">{option.label}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Department Selection */}
        {formData.targetAudience === 'department' && (
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
              Select Department *
            </label>
            <select
              name="targetDepartment"
              value={formData.targetDepartment}
              onChange={handleChange}
              className={`w-full px-3 py-2 text-sm md:text-base border rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent ${
                errors.targetDepartment ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select Department</option>
              {departments.map(dept => (
                <option key={dept._id} value={dept._id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
            {errors.targetDepartment && <p className="text-red-500 text-xs md:text-sm mt-1">{errors.targetDepartment}</p>}
          </div>
        )}

        {/* Teacher Selection - Scrollable container for mobile */}
        {formData.targetAudience === 'specific_teachers' && (
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
              Select Teachers *
            </label>
            <div className="max-h-40 md:max-h-60 overflow-y-auto border border-gray-300 rounded-lg p-2 md:p-3 space-y-1 md:space-y-2">
              {teachers.map(teacher => (
                <label key={teacher._id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.targetTeachers.includes(teacher._id)}
                    onChange={() => handleTeacherSelection(teacher._id)}
                    className="h-4 w-4 text-cadd-red focus:ring-cadd-red border-gray-300 rounded"
                  />
                  <div className="ml-2 md:ml-3">
                    <span className="text-xs md:text-sm font-medium text-gray-700">{teacher.name}</span>
                    <span className="text-xs md:text-sm text-gray-500 ml-1 md:ml-2">({teacher.email})</span>
                    {teacher.department && (
                      <span className="text-xs text-gray-400 ml-1 md:ml-2">- {teacher.department.name}</span>
                    )}
                  </div>
                </label>
              ))}
            </div>
            {errors.targetTeachers && <p className="text-red-500 text-xs md:text-sm mt-1">{errors.targetTeachers}</p>}
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              {formData.targetTeachers.length} teacher(s) selected
            </p>
          </div>
        )}
      </div>

      {/* Email Options */}
      <div className="space-y-4 md:space-y-6">
        <h3 className="text-base md:text-lg font-medium text-gray-900 border-b pb-2">Delivery Options</h3>

        <div className="flex items-start">
          <input
            type="checkbox"
            name="sendEmail"
            id="sendEmail"
            checked={formData.sendEmail}
            onChange={handleChange}
            className="h-4 w-4 text-cadd-red focus:ring-cadd-red border-gray-300 rounded mt-0.5"
          />
          <label htmlFor="sendEmail" className="ml-2 md:ml-3 flex items-start">
            <EnvelopeIcon className="h-4 w-4 md:h-5 md:w-5 text-gray-400 mr-1 md:mr-2 mt-0.5" />
            <span className="text-xs md:text-sm font-medium text-gray-700">
              Send email notifications to teachers
            </span>
          </label>
        </div>
        <p className="text-xs md:text-sm text-gray-500 ml-6 md:ml-7">
          Teachers will receive the notification in their dashboard regardless of this setting.
          Email notifications provide immediate alerts.
        </p>
      </div>

      {/* Form Actions - Stacked on mobile, side-by-side on desktop */}
      <div className="flex flex-col-reverse md:flex-row justify-end gap-3 md:space-x-4 pt-4 md:pt-6 border-t">
        <button
          type="button"
          onClick={() => navigate('/admin/notifications')}
          className="px-4 py-2 md:px-6 md:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm md:text-base"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 md:px-6 md:py-2 bg-gradient-to-r from-cadd-red to-cadd-pink text-white rounded-lg hover:from-cadd-pink hover:to-cadd-red transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2 text-sm md:text-base"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-white"></div>
          ) : (
            <SpeakerWaveIcon className="h-3 w-3 md:h-4 md:w-4" />
          )}
          <span>{loading ? 'Sending...' : 'Send Notification'}</span>
        </button>
      </div>
    </form>
  </div>
</div>
  )
}

export default NotificationForm
