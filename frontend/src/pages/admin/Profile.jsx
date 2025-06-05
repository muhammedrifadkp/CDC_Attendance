import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { authAPI } from '../../services/api'
import {
  UserIcon,
  EnvelopeIcon,
  PencilIcon,
  EyeIcon,
  EyeSlashIcon,
  KeyIcon,
  ShieldCheckIcon,
  CogIcon
} from '@heroicons/react/24/outline'

const AdminProfile = () => {
  const { user, updateUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordChangeStep, setPasswordChangeStep] = useState('request') // 'request', 'verify-otp', or 'set-password'
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    otp: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await authAPI.getProfile()
      setProfile(response.data)
      setFormData({
        name: response.data.name || '',
        email: response.data.email || ''
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to fetch profile')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const handleRequestOTP = async () => {
    try {
      setLoading(true)
      const response = await authAPI.requestPasswordChangeOTP()
      setOtpSent(true)
      setPasswordChangeStep('verify-otp')
      toast.success('OTP sent to your email address!')
      
      // Show preview URL in development
      if (response.data.emailPreviewUrl) {
        console.log('📧 Email Preview:', response.data.emailPreviewUrl)
      }
    } catch (error) {
      console.error('Error requesting OTP:', error)
      toast.error(error.response?.data?.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!passwordData.otp) {
      setErrors({ otp: 'OTP is required' })
      return
    }

    if (passwordData.otp.length !== 6) {
      setErrors({ otp: 'OTP must be 6 digits' })
      return
    }

    try {
      setLoading(true)
      await authAPI.verifyPasswordChangeOTP(passwordData.otp)
      setOtpVerified(true)
      setPasswordChangeStep('set-password')
      setErrors({})
      toast.success('OTP verified successfully! Now set your new password.')
    } catch (error) {
      console.error('Error verifying OTP:', error)
      toast.error(error.response?.data?.message || 'Invalid or expired OTP')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validatePasswordForm = () => {
    const newErrors = {}

    if (passwordChangeStep === 'set-password') {
      // For password setting step, we only need new password fields
      if (!passwordData.newPassword) {
        newErrors.newPassword = 'New password is required'
      } else if (passwordData.newPassword.length < 6) {
        newErrors.newPassword = 'Password must be at least 6 characters'
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      const response = await authAPI.updateProfile(formData)
      setProfile(response.data.user)
      updateUser(response.data.user) // Update user in auth context
      setIsEditing(false)
      toast.success('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    
    if (passwordChangeStep === 'request') {
      // Step 1: Request OTP
      await handleRequestOTP()
    } else if (passwordChangeStep === 'verify-otp') {
      // Step 2: Verify OTP
      await handleVerifyOTP()
    } else if (passwordChangeStep === 'set-password') {
      // Step 3: Set new password
      if (!validatePasswordForm()) {
        return
      }

      try {
        setLoading(true)
        await authAPI.verifyOTPAndChangePassword({
          otp: passwordData.otp,
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword
        })
        
        // Reset form
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          otp: ''
        })
        setShowPasswords({
          currentPassword: false,
          newPassword: false,
          confirmPassword: false
        })
        setShowPasswordForm(false)
        setPasswordChangeStep('request')
        setOtpSent(false)
        setOtpVerified(false)
        toast.success('Password changed successfully with OTP verification!')
      } catch (error) {
        console.error('Error changing password:', error)
        toast.error(error.response?.data?.message || 'Failed to change password')
      } finally {
        setLoading(false)
      }
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading && !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cadd-red"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
<div className="bg-gradient-to-r from-cadd-red to-cadd-pink rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 text-white">
  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full md:w-auto">
      <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-white/20 flex items-center justify-center">
        <span className="text-2xl sm:text-3xl font-bold text-white">
          {profile?.name?.charAt(0) || 'A'}
        </span>
      </div>
      <div className="flex-1">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">{profile?.name}</h1>
        <p className="text-white/90 text-sm sm:text-base md:text-lg">{profile?.email}</p>
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 mt-2">
          <span className="flex items-center text-white/80 text-sm sm:text-base">
            <ShieldCheckIcon className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
            Administrator
          </span>
          <span className="flex items-center text-white/80 text-sm sm:text-base">
            <CogIcon className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
            Full System Access
          </span>
        </div>
      </div>
    </div>
    <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0 w-full md:w-auto">
      {!isEditing && (
        <button
          onClick={() => setIsEditing(true)}
          className="flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm sm:text-base"
        >
          <PencilIcon className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
          Edit Profile
        </button>
      )}
      <button
        onClick={() => setShowPasswordForm(!showPasswordForm)}
        className="flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm sm:text-base"
      >
        <KeyIcon className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
        Change Password
      </button>
    </div>
  </div>
</div>

      {/* Password Change Form - Responsive */}
{showPasswordForm && (
  <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
      <h3 className="text-lg font-semibold text-gray-900">
        {passwordChangeStep === 'request' && 'Change Password'}
        {passwordChangeStep === 'verify-otp' && 'Verify Email Code'}
        {passwordChangeStep === 'set-password' && 'Set New Password'}
      </h3>
      {(passwordChangeStep === 'verify-otp' || passwordChangeStep === 'set-password') && (
        <span className="text-sm text-green-600 font-medium">
          ✅ OTP sent to your email
        </span>
      )}
    </div>
    
    {/* Progress Steps - Hide labels only on mobile */}
<div className="flex items-center justify-center mb-6">
  <div className="flex items-center space-x-1 sm:space-x-4">
    {/* Step 1 */}
    <div className="flex items-center">
      <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
        passwordChangeStep === 'request' ? 'bg-cadd-red text-white' : 'bg-green-500 text-white'
      }`}>
        {passwordChangeStep === 'request' ? '1' : '✓'}
      </div>
      <span className="ml-1 sm:ml-2 text-xs sm:text-sm font-medium text-gray-600 hidden sm:inline">
        Request OTP
      </span>
    </div>
    
    {/* Arrow */}
    <div className="w-3 sm:w-8 h-0.5 bg-gray-300"></div>
    
    {/* Step 2 */}
    <div className="flex items-center">
      <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
        passwordChangeStep === 'verify-otp' ? 'bg-cadd-red text-white' : 
        passwordChangeStep === 'set-password' ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
      }`}>
        {passwordChangeStep === 'verify-otp' ? '2' : passwordChangeStep === 'set-password' ? '✓' : '2'}
      </div>
      <span className="ml-1 sm:ml-2 text-xs sm:text-sm font-medium text-gray-600 hidden sm:inline">
        Verify OTP
      </span>
    </div>
    
    {/* Arrow */}
    <div className="w-3 sm:w-8 h-0.5 bg-gray-300"></div>
    
    {/* Step 3 */}
    <div className="flex items-center">
      <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
        passwordChangeStep === 'set-password' ? 'bg-cadd-red text-white' : 'bg-gray-300 text-gray-600'
      }`}>
        3
      </div>
      <span className="ml-1 sm:ml-2 text-xs sm:text-sm font-medium text-gray-600 hidden sm:inline">
        New Password
      </span>
    </div>
  </div>
</div>

    {passwordChangeStep === 'request' && (
      // Step 1: Request OTP - Responsive
      <div className="text-center py-4 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-cadd-red/10 rounded-full flex items-center justify-center mb-3 sm:mb-4">
            <KeyIcon className="h-5 w-5 sm:h-8 sm:w-8 text-cadd-red" />
          </div>
          <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Secure Password Change</h4>
          <p className="text-sm sm:text-base text-gray-600">
            For your security, we'll send a verification code to your email address before allowing you to change your password.
          </p>
        </div>
        <button
          onClick={handleRequestOTP}
          disabled={loading}
          className="px-4 py-2 sm:px-6 sm:py-3 bg-cadd-red text-white rounded-lg hover:bg-cadd-red/90 disabled:opacity-50 font-medium text-sm sm:text-base"
        >
          {loading ? 'Sending OTP...' : 'Send Verification Code'}
        </button>
      </div>
    )}

    {passwordChangeStep === 'verify-otp' && (
      // Step 2: Verify OTP - Responsive
      <div className="text-center py-4 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
            <EnvelopeIcon className="h-5 w-5 sm:h-8 sm:w-8 text-blue-600" />
          </div>
          <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Check Your Email</h4>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            We've sent a 6-digit verification code to your email address. Enter it below to continue.
          </p>
        </div>
        
        <form onSubmit={handlePasswordSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <input
              type="text"
              name="otp"
              value={passwordData.otp}
              onChange={handlePasswordChange}
              className="w-40 sm:w-48 px-3 sm:px-4 py-2 sm:py-3 text-center text-xl sm:text-2xl font-mono tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent"
              placeholder="000000"
              maxLength="6"
              required
            />
            {errors.otp && (
              <p className="text-red-500 text-xs sm:text-sm mt-1 sm:mt-2">{errors.otp}</p>
            )}
            <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">
              Enter the 6-digit code sent to your email
            </p>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 sm:px-6 sm:py-3 bg-cadd-red text-white rounded-lg hover:bg-cadd-red/90 disabled:opacity-50 font-medium text-sm sm:text-base"
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>
      </div>
    )}

    {passwordChangeStep === 'set-password' && (
      // Step 3: Set new password - Responsive
      <div className="py-4 sm:py-6">
        <div className="text-center mb-4 sm:mb-6">
          <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
            <KeyIcon className="h-5 w-5 sm:h-8 sm:w-8 text-green-600" />
          </div>
          <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Set New Password</h4>
          <p className="text-sm sm:text-base text-gray-600">
            Your email has been verified. Now create a strong new password for your admin account.
          </p>
        </div>
        
        <form onSubmit={handlePasswordSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.newPassword ? "text" : "password"}
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent text-sm sm:text-base"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('newPassword')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.newPassword ? (
                    <EyeSlashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.newPassword}</p>
              )}
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent text-sm sm:text-base"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirmPassword')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirmPassword ? (
                    <EyeSlashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0 justify-center">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 sm:px-6 sm:py-3 bg-cadd-red text-white rounded-lg hover:bg-cadd-red/90 disabled:opacity-50 font-medium text-sm sm:text-base"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
            <button
              type="button"
              onClick={() => {
                setPasswordChangeStep('verify-otp')
                setOtpVerified(false)
              }}
              className="px-4 py-2 sm:px-4 sm:py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm sm:text-base"
            >
              Back
            </button>
          </div>
        </form>
      </div>
    )}
    
    {/* Cancel button for all steps */}
    {passwordChangeStep !== 'request' && (
      <div className="mt-3 sm:mt-4 text-center">
        <button
          type="button"
          onClick={() => {
            setShowPasswordForm(false)
            setPasswordChangeStep('request')
            setOtpSent(false)
            setOtpVerified(false)
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '', otp: '' })
            setShowPasswords({ currentPassword: false, newPassword: false, confirmPassword: false })
            setErrors({})
          }}
          className="text-xs sm:text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel Password Change
        </button>
      </div>
    )}
  </div>
)}

      {/* Profile Information */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Administrator Profile</h2>
        </div>
        
        {isEditing ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <UserIcon className="h-4 w-4 inline mr-1" />
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent"
                  required
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <EnvelopeIcon className="h-4 w-4 inline mr-1" />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent"
                  required
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-cadd-red text-white rounded-lg hover:bg-cadd-red/90 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false)
                  setErrors({})
                  // Reset form data
                  setFormData({
                    name: profile?.name || '',
                    email: profile?.email || ''
                  })
                }}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-gray-900 font-medium">{profile?.name || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email Address</label>
                  <p className="text-gray-900">{profile?.email || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Role</label>
                  <p className="text-gray-900 font-semibold text-cadd-red">Administrator</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Account Status</label>
                  <p className="text-gray-900">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Account Created</label>
                  <p className="text-gray-900">{formatDate(profile?.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="text-gray-900">{formatDate(profile?.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminProfile
