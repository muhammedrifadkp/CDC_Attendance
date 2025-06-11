const express = require('express');
const keepAliveService = require('../services/keepAliveService');
const keepAliveLogger = require('../utils/keepAliveLogger');

const router = express.Router();

/**
 * @route   GET /api/keep-alive/ping
 * @desc    Keep-alive ping endpoint
 * @access  Public
 */
router.get('/ping', (req, res) => {
  try {
    const timestamp = new Date().toISOString();
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    // Log the ping request
    const userAgent = req.get('User-Agent') || 'unknown';
    const isInternalPing = userAgent.includes('CDC-Attendance-KeepAlive');
    
    console.log(`🏓 Keep-alive ping received from ${req.ip} (${isInternalPing ? 'internal' : 'external'})`);
    
    res.json({
      status: 'alive',
      message: 'CDC Attendance Management System is running',
      timestamp,
      uptime: Math.round(uptime),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024) // MB
      },
      service: {
        name: 'cdc-attendance-backend',
        renderService: process.env.RENDER_SERVICE_NAME || 'unknown',
        region: process.env.RENDER_REGION || 'unknown'
      },
      request: {
        ip: req.ip,
        userAgent: userAgent,
        isInternal: isInternalPing
      }
    });
    
  } catch (error) {
    console.error('❌ Keep-alive ping error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Keep-alive ping failed',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * @route   GET /api/keep-alive/status
 * @desc    Get keep-alive service status
 * @access  Public
 */
router.get('/status', (req, res) => {
  try {
    const serviceStatus = keepAliveService.getStatus();
    const loggerStats = keepAliveLogger.getStats();
    
    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      keepAlive: {
        service: serviceStatus,
        statistics: loggerStats,
        health: {
          isHealthy: serviceStatus.isRunning && loggerStats.successRate > 80,
          lastSuccessfulPing: loggerStats.lastSuccessTime,
          consecutiveFailures: loggerStats.totalPings - loggerStats.successfulPings,
          uptime: loggerStats.uptime
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Keep-alive status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get keep-alive status',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * @route   POST /api/keep-alive/manual-ping
 * @desc    Manually trigger a keep-alive ping
 * @access  Public
 */
router.post('/manual-ping', async (req, res) => {
  try {
    console.log('🔄 Manual keep-alive ping triggered');
    
    // Perform the ping asynchronously
    keepAliveService.performKeepAlivePing()
      .then(() => {
        console.log('✅ Manual keep-alive ping completed successfully');
      })
      .catch((error) => {
        console.error('❌ Manual keep-alive ping failed:', error);
      });
    
    res.json({
      status: 'success',
      message: 'Manual keep-alive ping triggered',
      timestamp: new Date().toISOString(),
      note: 'Ping is being performed asynchronously'
    });
    
  } catch (error) {
    console.error('❌ Manual ping trigger error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to trigger manual ping',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * @route   GET /api/keep-alive/stats
 * @desc    Get detailed keep-alive statistics
 * @access  Public
 */
router.get('/stats', (req, res) => {
  try {
    const stats = keepAliveLogger.getStats();
    const serviceStatus = keepAliveService.getStatus();
    
    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      statistics: {
        ...stats,
        configuration: {
          pingInterval: serviceStatus.pingInterval,
          timeout: serviceStatus.timeout,
          retryAttempts: serviceStatus.retryAttempts,
          selfPingUrl: serviceStatus.selfPingUrl,
          externalPingCount: serviceStatus.externalPingUrls.length
        },
        performance: {
          averageResponseTime: stats.averageResponseTime,
          successRate: stats.successRate,
          totalRequests: stats.totalPings,
          uptime: stats.uptime
        },
        health: {
          isServiceRunning: serviceStatus.isRunning,
          lastPingTime: stats.lastPingTime,
          timeSinceLastSuccess: stats.timeSinceLastSuccess,
          isHealthy: serviceStatus.isRunning && stats.successRate > 80
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Keep-alive stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get keep-alive statistics',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * @route   POST /api/keep-alive/reset-stats
 * @desc    Reset keep-alive statistics
 * @access  Public
 */
router.post('/reset-stats', (req, res) => {
  try {
    keepAliveLogger.resetStats();
    
    res.json({
      status: 'success',
      message: 'Keep-alive statistics reset successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Reset stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to reset statistics',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * @route   GET /api/keep-alive/health
 * @desc    Simple health check for monitoring services
 * @access  Public
 */
router.get('/health', (req, res) => {
  try {
    const stats = keepAliveLogger.getStats();
    const serviceStatus = keepAliveService.getStatus();
    
    const isHealthy = serviceStatus.isRunning && stats.successRate > 80;
    
    if (isHealthy) {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: stats.uptime,
        successRate: stats.successRate
      });
    } else {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        issues: {
          serviceRunning: serviceStatus.isRunning,
          successRate: stats.successRate,
          timeSinceLastSuccess: stats.timeSinceLastSuccess
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Keep-alive health check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

module.exports = router;
