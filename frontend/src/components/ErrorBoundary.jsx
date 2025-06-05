/**
 * Advanced Error Boundary Component
 * Provides comprehensive error handling with reporting and recovery options
 */

import React from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon } from '@heroicons/react/24/outline';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2)
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    this.setState({
      error,
      errorInfo
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Error Boundary Caught:', error);
      console.error('📍 Error Info:', errorInfo);
      console.error('📊 Component Stack:', errorInfo.componentStack);
    }

    // Report error to monitoring service (if available)
    this.reportError(error, errorInfo);
  }

  reportError = (error, errorInfo) => {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.props.userId || 'anonymous',
      errorId: this.state.errorId,
      retryCount: this.state.retryCount
    };

    // Send to error reporting service
    if (window.errorReporter) {
      window.errorReporter.report(errorReport);
    }

    // Store in localStorage for debugging
    try {
      const existingErrors = JSON.parse(localStorage.getItem('errorBoundaryLogs') || '[]');
      existingErrors.push(errorReport);
      
      // Keep only last 10 errors
      if (existingErrors.length > 10) {
        existingErrors.splice(0, existingErrors.length - 10);
      }
      
      localStorage.setItem('errorBoundaryLogs', JSON.stringify(existingErrors));
    } catch (e) {
      console.warn('Could not store error log:', e);
    }
  };

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback, showDetails = false } = this.props;
      const { error, errorInfo, errorId, retryCount } = this.state;

      // Use custom fallback if provided
      if (Fallback) {
        return (
          <Fallback
            error={error}
            errorInfo={errorInfo}
            onRetry={this.handleRetry}
            retryCount={retryCount}
          />
        );
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                <ExclamationTriangleIcon className="mx-auto h-16 w-16 text-red-500" />
                <h2 className="mt-4 text-2xl font-bold text-gray-900">
                  Something went wrong
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  We're sorry, but something unexpected happened. Please try again.
                </p>
                
                {errorId && (
                  <p className="mt-2 text-xs text-gray-400">
                    Error ID: {errorId}
                  </p>
                )}

                {retryCount > 0 && (
                  <p className="mt-1 text-xs text-orange-600">
                    Retry attempts: {retryCount}
                  </p>
                )}
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={this.handleRetry}
                  className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  Try Again
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <HomeIcon className="h-4 w-4 mr-2" />
                  Go to Home
                </button>

                <button
                  onClick={this.handleReload}
                  className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Reload Page
                </button>
              </div>

              {(showDetails || process.env.NODE_ENV === 'development') && error && (
                <details className="mt-6">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    Technical Details
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded-md">
                    <div className="text-xs text-gray-600 space-y-2">
                      <div>
                        <strong>Error:</strong>
                        <pre className="mt-1 whitespace-pre-wrap break-all">
                          {error.message}
                        </pre>
                      </div>
                      
                      {error.stack && (
                        <div>
                          <strong>Stack Trace:</strong>
                          <pre className="mt-1 whitespace-pre-wrap break-all text-xs">
                            {error.stack}
                          </pre>
                        </div>
                      )}
                      
                      {errorInfo?.componentStack && (
                        <div>
                          <strong>Component Stack:</strong>
                          <pre className="mt-1 whitespace-pre-wrap break-all text-xs">
                            {errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </details>
              )}

              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  If this problem persists, please contact support.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Hook for error reporting from functional components
export const useErrorHandler = () => {
  const reportError = (error, errorInfo = {}) => {
    const errorReport = {
      message: error.message || String(error),
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...errorInfo
    };

    console.error('🚨 Manual Error Report:', errorReport);

    // Store in localStorage
    try {
      const existingErrors = JSON.parse(localStorage.getItem('manualErrorLogs') || '[]');
      existingErrors.push(errorReport);
      
      if (existingErrors.length > 10) {
        existingErrors.splice(0, existingErrors.length - 10);
      }
      
      localStorage.setItem('manualErrorLogs', JSON.stringify(existingErrors));
    } catch (e) {
      console.warn('Could not store manual error log:', e);
    }
  };

  return { reportError };
};

// Utility to get stored error logs
export const getErrorLogs = () => {
  try {
    const boundaryLogs = JSON.parse(localStorage.getItem('errorBoundaryLogs') || '[]');
    const manualLogs = JSON.parse(localStorage.getItem('manualErrorLogs') || '[]');
    
    return {
      boundaryErrors: boundaryLogs,
      manualErrors: manualLogs,
      total: boundaryLogs.length + manualLogs.length
    };
  } catch (e) {
    return {
      boundaryErrors: [],
      manualErrors: [],
      total: 0
    };
  }
};

// Clear error logs
export const clearErrorLogs = () => {
  try {
    localStorage.removeItem('errorBoundaryLogs');
    localStorage.removeItem('manualErrorLogs');
    return true;
  } catch (e) {
    return false;
  }
};

export default ErrorBoundary;
