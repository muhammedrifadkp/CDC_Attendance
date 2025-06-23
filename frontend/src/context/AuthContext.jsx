import React, { createContext, useState, useContext, useEffect } from 'react'
import { authAPI, getToken, setToken, removeToken, startTokenRefreshTimer, stopTokenRefreshTimer, forceLogout } from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const MAX_RETRIES = 3

  // Check if user is logged in
  useEffect(() => {
    let mounted = true
    let retryTimeout
    let profileCheckInterval

    const checkLoggedIn = async () => {
      try {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
        const token = getToken()
        const lastCheck = localStorage.getItem('lastProfileCheck')
        const now = Date.now()

        if (!isLoggedIn || !token) {
          if (mounted) {
            console.log('No login state or valid token found')
            setUser(null)
            setLoading(false)
            setRetryCount(0)
          }
          return
        }

        // Check cache validity and expiry
        const timeSinceLastCheck = lastCheck ? now - parseInt(lastCheck) : Infinity
        const cachedUser = localStorage.getItem('cachedUser')
        const cacheExpired = timeSinceLastCheck >= 30 * 60 * 1000 // Extended to 30 minutes
        const forceRefresh = localStorage.getItem('forceProfileRefresh') === 'true'

        // Use cache if available and not expired
        if (!cacheExpired && !forceRefresh && cachedUser) {
          if (mounted) {
            console.log('Using cached profile data')
            const parsedUser = JSON.parse(cachedUser)
            // Ensure cached user has _id field
            const userData = {
              ...parsedUser,
              _id: parsedUser._id || parsedUser.id
            }
            setUser(userData)
            setLoading(false)
            setRetryCount(0)
          }
          return
        }

        // If we're force refreshing, remove the flag
        localStorage.removeItem('forceProfileRefresh')

        const res = await authAPI.getProfile()

        if (mounted) {
          console.log('Profile fetched successfully:', res.data)

          // Ensure user data has required fields for IndexedDB
          const userData = {
            ...res.data,
            _id: res.data._id || res.data.id // Ensure _id field exists
          }

          localStorage.setItem('lastProfileCheck', now.toString())
          localStorage.setItem('cachedUser', JSON.stringify(userData))
          setUser(userData)
          setLoading(false)
          setRetryCount(0)
        }
      } catch (error) {
        console.error('Profile check error:', error)
        
        // Handle rate limiting (429)
        if (error.response?.status === 429) {
          console.log('Rate limited, using cached data if available')
          const cachedUser = localStorage.getItem('cachedUser')

          if (cachedUser) {
            if (mounted) {
              const parsedUser = JSON.parse(cachedUser)
              // Ensure cached user has _id field
              const userData = {
                ...parsedUser,
                _id: parsedUser._id || parsedUser.id
              }
              setUser(userData)
              setLoading(false)
              // Don't reset retry count to prevent rapid retries
            }
            return
          }
        }

        // Handle unauthorized (401/403) - but only if user was actually logged in
        if (error.response?.status === 401 || error.response?.status === 403) {
          const errorType = error.response?.data?.error;

          // Only handle as logout if user was actually authenticated
          if (getToken() && (errorType === 'TokenExpiredError' || errorType === 'InvalidTokenError')) {
            if (mounted) {
              console.log('Session expired or unauthorized - logging out')
              handleLogout()
            }
            return
          } else if (!getToken()) {
            // User wasn't logged in anyway, just set loading to false
            if (mounted) {
              setLoading(false)
            }
            return
          }
        }

        // Retry on network errors, rate limits, or server errors
        if (mounted && retryCount < MAX_RETRIES) {
          const shouldRetry = !error.response || 
                            error.response.status === 429 ||
                            error.response.status >= 500
          
          if (shouldRetry) {
            // Exponential backoff with additional random delay to prevent thundering herd
            const baseDelay = Math.min(1000 * Math.pow(2, retryCount), 30000)
            const jitter = Math.random() * 1000
            const delay = baseDelay + jitter
            
            console.log(`Retrying profile check in ${Math.round(delay)}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`)
            setRetryCount(prev => prev + 1)
            
            retryTimeout = setTimeout(checkLoggedIn, delay)
            return
          }
        }

        // Give up after max retries or on unrecoverable errors
        if (mounted) {
          if (error.response?.status === 429) {
            // On rate limit exhaustion, just set loading false but don't log out
            console.log('Rate limit exceeded, will try again later')
            setLoading(false)
          } else {
            console.log('Max retries exceeded or unrecoverable error')
            handleLogout()
          }
        }
      }
    }

    const handleLogout = () => {
      removeToken()
      stopTokenRefreshTimer()
      localStorage.removeItem('lastProfileCheck')
      localStorage.removeItem('cachedUser')
      localStorage.removeItem('forceProfileRefresh')
      setUser(null)
      setLoading(false)
      setRetryCount(0)
    }

    // Initial check
    checkLoggedIn()

    // Set up periodic checks with a minimum interval of 2 minutes
    profileCheckInterval = setInterval(() => {
      const lastCheck = localStorage.getItem('lastProfileCheck')
      const now = Date.now()
      const timeSinceLastCheck = lastCheck ? now - parseInt(lastCheck) : Infinity
      
      // Only check if it's been at least 2 minutes since the last check
      if (timeSinceLastCheck >= 2 * 60 * 1000) {
        checkLoggedIn()
      }
    }, 2 * 60 * 1000)

    // Inactivity timer and cleanup
    let inactivityTimer
    const INACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000 // 2 hours

    const resetTimer = () => {
      clearTimeout(inactivityTimer)
      inactivityTimer = setTimeout(() => {
        logout()
        toast.info('You have been logged out due to inactivity')
      }, INACTIVITY_TIMEOUT)
    }

    if (user) {
      resetTimer()
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
      events.forEach(event => document.addEventListener(event, resetTimer))

      return () => {
        mounted = false
        clearTimeout(inactivityTimer)
        clearTimeout(retryTimeout)
        clearInterval(profileCheckInterval)
        events.forEach(event => document.removeEventListener(event, resetTimer))
      }
    }

    return () => {
      mounted = false
      clearTimeout(retryTimeout)
      clearInterval(profileCheckInterval)
      // Clear any pending token refresh timers
      stopTokenRefreshTimer()
    }
  }, []) // Dependencies array is empty to prevent loops

  // Login
  const login = async (email, password) => {
    try {
      console.log(`Attempting to login with email: ${email}`)
      const res = await authAPI.login({ email, password })
      console.log('Login successful, user data:', res.data)

      // Ensure user data has required fields for IndexedDB
      const userData = {
        ...res.data,
        _id: res.data._id || res.data.id // Ensure _id field exists
      }

      // Store user in state
      setUser(userData)

      // Set login flag - token is now handled by HTTP-only cookies
      setToken() // This now only sets isLoggedIn flag
      startTokenRefreshTimer()

      return userData
    } catch (error) {
      console.error('Login error:', error)
      console.error('Response data:', error.response?.data)

      // Clear any stale login state
      removeToken()
      setUser(null)

      throw new Error(
        error.response?.data?.message || 'Invalid email or password'
      )
    }
  }

  // Update user data
  const updateUser = (userData) => {
    setUser(userData)
  }

  // Logout
  const logout = async () => {
    try {
      console.log('Logging out...')
      await authAPI.logout()

      // Clear user state
      setUser(null)

      // Remove all auth data securely
      removeToken()
      stopTokenRefreshTimer()

      console.log('Logout successful')
    } catch (error) {
      console.error('Logout error:', error)

      // Even if the API call fails, clear the local state
      setUser(null)
      removeToken()
      stopTokenRefreshTimer()
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
