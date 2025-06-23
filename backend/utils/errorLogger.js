/**
 * Enhanced Error Logging and Monitoring Utility
 * Provides comprehensive error tracking and reporting
 */

const fs = require('fs');
const path = require('path');

class ErrorLogger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDirectory();
  }

  /**
   * Ensure log directory exists
   */
  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Log error with context
   */
  logError(error, context = {}) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      },
      context: {
        ...context,
        nodeVersion: process.version,
        platform: process.platform,
        memory: process.memoryUsage()
      }
    };

    // Write to error log file
    const logFile = path.join(this.logDir, 'error.log');
    const logLine = JSON.stringify(errorEntry) + '\n';
    
    fs.appendFileSync(logFile, logLine);

    // Console log for development
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Error logged:', errorEntry);
    }

    return errorEntry;
  }

  /**
   * Log API errors with request context
   */
  logAPIError(error, req, res) {
    const context = {
      type: 'API_ERROR',
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      statusCode: res.statusCode,
      headers: req.headers,
      body: req.method !== 'GET' ? req.body : undefined
    };

    return this.logError(error, context);
  }

  /**
   * Log database errors
   */
  logDatabaseError(error, operation, collection = null) {
    const context = {
      type: 'DATABASE_ERROR',
      operation,
      collection,
      mongoError: {
        code: error.code,
        codeName: error.codeName,
        index: error.index,
        keyPattern: error.keyPattern,
        keyValue: error.keyValue
      }
    };

    return this.logError(error, context);
  }

  /**
   * Log authentication errors
   */
  logAuthError(error, req, attemptType = 'login') {
    const context = {
      type: 'AUTH_ERROR',
      attemptType,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      email: req.body?.email,
      timestamp: new Date().toISOString()
    };

    return this.logError(error, context);
  }

  /**
   * Log email service errors
   */
  logEmailError(error, emailType, recipient = null) {
    const context = {
      type: 'EMAIL_ERROR',
      emailType,
      recipient,
      smtpCode: error.code,
      smtpResponse: error.response
    };

    return this.logError(error, context);
  }

  /**
   * Get error statistics
   */
  getErrorStats(hours = 24) {
    try {
      const logFile = path.join(this.logDir, 'error.log');
      
      if (!fs.existsSync(logFile)) {
        return { total: 0, byType: {}, recent: [] };
      }

      const logs = fs.readFileSync(logFile, 'utf8')
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
      const recentLogs = logs.filter(log => new Date(log.timestamp) > cutoff);

      const byType = {};
      recentLogs.forEach(log => {
        const type = log.context?.type || 'UNKNOWN';
        byType[type] = (byType[type] || 0) + 1;
      });

      return {
        total: recentLogs.length,
        byType,
        recent: recentLogs.slice(-10) // Last 10 errors
      };
    } catch (error) {
      console.error('Error reading error stats:', error);
      return { total: 0, byType: {}, recent: [] };
    }
  }

  /**
   * Clear old logs (keep last 30 days)
   */
  cleanupLogs() {
    try {
      const logFile = path.join(this.logDir, 'error.log');
      
      if (!fs.existsSync(logFile)) {
        return;
      }

      const logs = fs.readFileSync(logFile, 'utf8')
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days
      const recentLogs = logs.filter(log => new Date(log.timestamp) > cutoff);

      const newContent = recentLogs.map(log => JSON.stringify(log)).join('\n') + '\n';
      fs.writeFileSync(logFile, newContent);

      console.log(`Cleaned up error logs. Kept ${recentLogs.length} recent entries.`);
    } catch (error) {
      console.error('Error cleaning up logs:', error);
    }
  }
}

// Create singleton instance
const errorLogger = new ErrorLogger();

// Schedule daily cleanup
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    errorLogger.cleanupLogs();
  }, 24 * 60 * 60 * 1000); // Daily
}

module.exports = errorLogger;
