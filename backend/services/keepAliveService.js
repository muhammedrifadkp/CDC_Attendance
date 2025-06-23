const cron = require('node-cron');
const http = require('http');
const https = require('https');
const keepAliveLogger = require('../utils/keepAliveLogger');

/**
 * Keep-Alive Service
 * Prevents Render from shutting down the service due to inactivity
 * by sending periodic ping requests to the service itself
 */
class KeepAliveService {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
    this.pingInterval = '*/10 * * * *'; // Every 10 minutes
    this.selfPingUrl = null;
    this.externalPingUrls = [];
    this.timeout = 30000; // 30 seconds timeout
    this.retryAttempts = 3;
    this.retryDelay = 5000; // 5 seconds between retries
  }

  /**
   * Initialize the keep-alive service
   */
  init() {
    try {
      // Determine the service URL for self-ping
      this.selfPingUrl = this.buildSelfPingUrl();
      
      // Add external ping URLs if configured
      this.setupExternalPingUrls();
      
      keepAliveLogger.logServiceStart();
      
      // Start the cron job
      this.start();
      
      // Setup graceful shutdown
      this.setupGracefulShutdown();
      
      console.log('🔄 Keep-alive service initialized successfully');
      console.log(`📍 Self-ping URL: ${this.selfPingUrl}`);
      console.log(`⏰ Ping interval: Every 10 minutes`);
      
    } catch (error) {
      console.error('❌ Failed to initialize keep-alive service:', error);
      keepAliveLogger.logFailure(error, { context: 'initialization' });
    }
  }

  /**
   * Build self-ping URL based on environment
   */
  buildSelfPingUrl() {
    // Check if we have a Render external URL (production)
    if (process.env.RENDER_EXTERNAL_URL) {
      const cleanUrl = process.env.RENDER_EXTERNAL_URL.replace(/\/$/, '');
      return `${cleanUrl}/api/keep-alive/ping`;
    }

    // Check if we have a Render service URL (production)
    if (process.env.RENDER_SERVICE_URL) {
      const cleanUrl = process.env.RENDER_SERVICE_URL.replace(/\/$/, '');
      return `${cleanUrl}/api/keep-alive/ping`;
    }

    // For production without Render URLs, try to construct from known backend URL
    if (process.env.NODE_ENV === 'production') {
      // Use the known backend URL from your deployment
      return 'https://cdc-attendance-backend.onrender.com/api/keep-alive/ping';
    }

    // For development/local testing
    const protocol = 'http';
    const host = `localhost:${process.env.PORT || 5000}`;

    return `${protocol}://${host}/api/keep-alive/ping`;
  }

  /**
   * Setup external ping URLs from environment variables
   */
  setupExternalPingUrls() {
    const externalUrls = process.env.KEEP_ALIVE_EXTERNAL_URLS;
    if (externalUrls) {
      this.externalPingUrls = externalUrls.split(',').map(url => url.trim());
      console.log(`🌐 External ping URLs configured: ${this.externalPingUrls.length}`);
    }
  }

  /**
   * Start the keep-alive service
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ Keep-alive service is already running');
      return;
    }

    try {
      this.cronJob = cron.schedule(this.pingInterval, async () => {
        await this.performKeepAlivePing();
      }, {
        scheduled: false,
        timezone: 'UTC'
      });

      this.cronJob.start();
      this.isRunning = true;
      
      console.log('✅ Keep-alive service started');
      
      // Perform initial ping after a short delay
      setTimeout(() => {
        this.performKeepAlivePing();
      }, 5000);
      
    } catch (error) {
      console.error('❌ Failed to start keep-alive service:', error);
      keepAliveLogger.logFailure(error, { context: 'service_start' });
    }
  }

  /**
   * Stop the keep-alive service
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Keep-alive service is not running');
      return;
    }

    try {
      if (this.cronJob) {
        this.cronJob.stop();
        this.cronJob.destroy();
        this.cronJob = null;
      }
      
      this.isRunning = false;
      keepAliveLogger.logServiceStop();
      console.log('🛑 Keep-alive service stopped');
      
    } catch (error) {
      console.error('❌ Failed to stop keep-alive service:', error);
    }
  }

  /**
   * Perform keep-alive ping
   */
  async performKeepAlivePing() {
    console.log('🏓 Performing keep-alive ping...');
    
    const startTime = Date.now();
    
    try {
      // Self-ping
      await this.pingUrl(this.selfPingUrl, 'self');
      
      // External pings (if configured)
      for (const url of this.externalPingUrls) {
        try {
          await this.pingUrl(url, 'external');
        } catch (error) {
          console.warn(`⚠️ External ping failed for ${url}:`, error.message);
        }
      }
      
      const responseTime = Date.now() - startTime;
      keepAliveLogger.logSuccess(responseTime, {
        selfPing: true,
        externalPings: this.externalPingUrls.length
      });
      
    } catch (error) {
      keepAliveLogger.logFailure(error, {
        url: this.selfPingUrl,
        attempt: 'keep-alive-ping'
      });
    }
  }

  /**
   * Ping a specific URL with retry logic
   */
  async pingUrl(url, type = 'unknown') {
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const startTime = Date.now();
        await this.makeHttpRequest(url);
        const responseTime = Date.now() - startTime;
        
        console.log(`✅ ${type} ping successful: ${url} (${responseTime}ms)`);
        return responseTime;
        
      } catch (error) {
        console.warn(`⚠️ ${type} ping attempt ${attempt}/${this.retryAttempts} failed for ${url}:`, error.message);
        
        if (attempt === this.retryAttempts) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
  }

  /**
   * Make HTTP request with timeout
   */
  makeHttpRequest(url) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const httpModule = isHttps ? https : http;
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        timeout: this.timeout,
        headers: {
          'User-Agent': 'CDC-Attendance-KeepAlive/1.0',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      };

      const req = httpModule.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ statusCode: res.statusCode, data });
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }

  /**
   * Setup graceful shutdown handlers
   */
  setupGracefulShutdown() {
    const shutdown = () => {
      console.log('🔄 Gracefully shutting down keep-alive service...');
      this.stop();
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    process.on('SIGUSR2', shutdown); // For nodemon
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      selfPingUrl: this.selfPingUrl,
      externalPingUrls: this.externalPingUrls,
      pingInterval: this.pingInterval,
      timeout: this.timeout,
      retryAttempts: this.retryAttempts,
      stats: keepAliveLogger.getStats()
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config = {}) {
    if (config.timeout) this.timeout = config.timeout;
    if (config.retryAttempts) this.retryAttempts = config.retryAttempts;
    if (config.retryDelay) this.retryDelay = config.retryDelay;
    
    console.log('🔧 Keep-alive service configuration updated');
  }
}

// Create singleton instance
const keepAliveService = new KeepAliveService();

module.exports = keepAliveService;
