/**
 * Authentication Utilities
 * Helper functions for managing authentication state
 */

import { forceLogout } from '../services/api';
import toast from 'react-hot-toast';

/**
 * Clear all authentication data and redirect to login
 * Use this when you encounter authentication errors
 */
export const clearAuthAndRedirect = async (message = 'Please login again') => {
  try {
    console.log('🧹 Clearing authentication data...');
    
    // Force logout to clear all data
    await forceLogout();
    
    // Show message to user
    toast.error(message);
    
    // Small delay before redirect to ensure cleanup is complete
    setTimeout(() => {
      window.location.href = '/login';
    }, 1000);
    
  } catch (error) {
    console.error('Error during auth cleanup:', error);
    // Force redirect even if cleanup fails
    window.location.href = '/login';
  }
};

/**
 * Check if current authentication state is valid
 */
export const isAuthValid = () => {
  try {
    // Check if we have the login flag
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    // Check if we have cached user data
    const cachedUser = localStorage.getItem('cachedUser');
    
    return isLoggedIn && cachedUser;
  } catch (error) {
    console.error('Error checking auth validity:', error);
    return false;
  }
};

/**
 * Force refresh authentication state
 */
export const refreshAuthState = () => {
  try {
    localStorage.setItem('forceProfileRefresh', 'true');
    window.location.reload();
  } catch (error) {
    console.error('Error refreshing auth state:', error);
    clearAuthAndRedirect('Authentication refresh failed');
  }
};
