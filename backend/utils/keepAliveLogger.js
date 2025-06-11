const winston = require('winston');

/**
 * Keep-Alive Logger
 * Specialized logger for keep-alive service monitoring
 */
class KeepAliveLogger {
  constructor() {
    this.logger = winston.createLogger({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'keep-alive' },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });

    // Keep-alive statistics
    this.stats = {
      totalPings: 0,
      successfulPings: 0,
      failedPings: 0,
      lastPingTime: null,
      lastSuccessTime: null,
      lastFailureTime: null,
      averageResponseTime: 0,
      responseTimes: [],
      startTime: new Date(),
      uptime: 0
    };

    // Keep only last 100 response times for average calculation
    this.maxResponseTimes = 100;
  }

  /**
   * Log successful ping
   */
  logSuccess(responseTime, details = {}) {
    this.stats.totalPings++;
    this.stats.successfulPings++;
    this.stats.lastPingTime = new Date();
    this.stats.lastSuccessTime = new Date();
    
    // Update response times
    this.stats.responseTimes.push(responseTime);
    if (this.stats.responseTimes.length > this.maxResponseTimes) {
      this.stats.responseTimes.shift();
    }
    
    // Calculate average response time
    this.stats.averageResponseTime = this.stats.responseTimes.reduce((a, b) => a + b, 0) / this.stats.responseTimes.length;
    
    this.logger.info('Keep-alive ping successful', {
      responseTime,
      totalPings: this.stats.totalPings,
      successRate: this.getSuccessRate(),
      averageResponseTime: Math.round(this.stats.averageResponseTime),
      ...details
    });
  }

  /**
   * Log failed ping
   */
  logFailure(error, details = {}) {
    this.stats.totalPings++;
    this.stats.failedPings++;
    this.stats.lastPingTime = new Date();
    this.stats.lastFailureTime = new Date();
    
    this.logger.error('Keep-alive ping failed', {
      error: error.message,
      totalPings: this.stats.totalPings,
      successRate: this.getSuccessRate(),
      timeSinceLastSuccess: this.getTimeSinceLastSuccess(),
      ...details
    });
  }

  /**
   * Log service start
   */
  logServiceStart() {
    this.logger.info('Keep-alive service started', {
      environment: process.env.NODE_ENV,
      renderService: process.env.RENDER_SERVICE_NAME || 'unknown',
      interval: '10 minutes'
    });
  }

  /**
   * Log service stop
   */
  logServiceStop() {
    this.logger.info('Keep-alive service stopped', {
      totalPings: this.stats.totalPings,
      successfulPings: this.stats.successfulPings,
      failedPings: this.stats.failedPings,
      uptime: this.getUptime()
    });
  }

  /**
   * Get success rate percentage
   */
  getSuccessRate() {
    if (this.stats.totalPings === 0) return 100;
    return Math.round((this.stats.successfulPings / this.stats.totalPings) * 100);
  }

  /**
   * Get time since last successful ping
   */
  getTimeSinceLastSuccess() {
    if (!this.stats.lastSuccessTime) return 'Never';
    const diff = Date.now() - this.stats.lastSuccessTime.getTime();
    return Math.round(diff / 1000 / 60); // minutes
  }

  /**
   * Get service uptime
   */
  getUptime() {
    const diff = Date.now() - this.stats.startTime.getTime();
    return Math.round(diff / 1000 / 60); // minutes
  }

  /**
   * Get comprehensive statistics
   */
  getStats() {
    return {
      ...this.stats,
      successRate: this.getSuccessRate(),
      timeSinceLastSuccess: this.getTimeSinceLastSuccess(),
      uptime: this.getUptime(),
      averageResponseTime: Math.round(this.stats.averageResponseTime)
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalPings: 0,
      successfulPings: 0,
      failedPings: 0,
      lastPingTime: null,
      lastSuccessTime: null,
      lastFailureTime: null,
      averageResponseTime: 0,
      responseTimes: [],
      startTime: new Date(),
      uptime: 0
    };
    
    this.logger.info('Keep-alive statistics reset');
  }
}

// Create singleton instance
const keepAliveLogger = new KeepAliveLogger();

module.exports = keepAliveLogger;
