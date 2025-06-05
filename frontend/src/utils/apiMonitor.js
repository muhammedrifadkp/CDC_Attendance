/**
 * API Monitoring and Caching System
 * Provides comprehensive API performance monitoring and intelligent caching
 */

class APIMonitor {
  constructor() {
    this.metrics = new Map();
    this.cache = new Map();
    this.requestQueue = [];
    this.isOnline = navigator.onLine;
    this.retryAttempts = new Map();
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processQueuedRequests();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Monitor API request performance
   */
  monitorRequest(url, method, startTime, endTime, status, error = null) {
    const duration = endTime - startTime;
    const key = `${method}:${url}`;
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        url,
        method,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalDuration: 0,
        averageDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        lastRequest: null,
        errors: []
      });
    }
    
    const metric = this.metrics.get(key);
    metric.totalRequests++;
    metric.totalDuration += duration;
    metric.averageDuration = metric.totalDuration / metric.totalRequests;
    metric.minDuration = Math.min(metric.minDuration, duration);
    metric.maxDuration = Math.max(metric.maxDuration, duration);
    metric.lastRequest = new Date().toISOString();
    
    if (status >= 200 && status < 300) {
      metric.successfulRequests++;
    } else {
      metric.failedRequests++;
      if (error) {
        metric.errors.push({
          timestamp: new Date().toISOString(),
          status,
          error: error.message || String(error),
          duration
        });
        
        // Keep only last 10 errors
        if (metric.errors.length > 10) {
          metric.errors.splice(0, metric.errors.length - 10);
        }
      }
    }
    
    // Log slow requests
    if (duration > 3000) {
      console.warn(`🐌 Slow API request detected: ${key} took ${duration}ms`);
    }
    
    // Log failed requests
    if (status >= 400) {
      console.error(`❌ API request failed: ${key} - Status: ${status}`);
    }
  }

  /**
   * Get performance metrics for a specific endpoint
   */
  getMetrics(url, method) {
    const key = `${method}:${url}`;
    return this.metrics.get(key) || null;
  }

  /**
   * Get all performance metrics
   */
  getAllMetrics() {
    const metrics = {};
    for (const [key, value] of this.metrics.entries()) {
      metrics[key] = { ...value };
    }
    return metrics;
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const allMetrics = Array.from(this.metrics.values());
    
    if (allMetrics.length === 0) {
      return {
        totalRequests: 0,
        successRate: 0,
        averageResponseTime: 0,
        slowestEndpoint: null,
        fastestEndpoint: null
      };
    }
    
    const totalRequests = allMetrics.reduce((sum, m) => sum + m.totalRequests, 0);
    const totalSuccessful = allMetrics.reduce((sum, m) => sum + m.successfulRequests, 0);
    const successRate = (totalSuccessful / totalRequests) * 100;
    
    const avgResponseTime = allMetrics.reduce((sum, m) => sum + m.averageDuration, 0) / allMetrics.length;
    
    const slowestEndpoint = allMetrics.reduce((slowest, current) => 
      current.averageDuration > (slowest?.averageDuration || 0) ? current : slowest
    );
    
    const fastestEndpoint = allMetrics.reduce((fastest, current) => 
      current.averageDuration < (fastest?.averageDuration || Infinity) ? current : fastest
    );
    
    return {
      totalRequests,
      successRate: Math.round(successRate * 100) / 100,
      averageResponseTime: Math.round(avgResponseTime),
      slowestEndpoint: slowestEndpoint ? {
        url: slowestEndpoint.url,
        method: slowestEndpoint.method,
        averageDuration: Math.round(slowestEndpoint.averageDuration)
      } : null,
      fastestEndpoint: fastestEndpoint ? {
        url: fastestEndpoint.url,
        method: fastestEndpoint.method,
        averageDuration: Math.round(fastestEndpoint.averageDuration)
      } : null
    };
  }

  /**
   * Cache API response
   */
  cacheResponse(key, data, ttl = 5 * 60 * 1000) { // Default 5 minutes
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Get cached response
   */
  getCachedResponse(key) {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    // Check if cache has expired
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Queue request for offline handling
   */
  queueRequest(requestConfig) {
    this.requestQueue.push({
      ...requestConfig,
      timestamp: Date.now()
    });
    
    // Limit queue size
    if (this.requestQueue.length > 50) {
      this.requestQueue.splice(0, this.requestQueue.length - 50);
    }
  }

  /**
   * Process queued requests when back online
   */
  async processQueuedRequests() {
    if (!this.isOnline || this.requestQueue.length === 0) {
      return;
    }
    
    console.log(`📡 Processing ${this.requestQueue.length} queued requests...`);
    
    const requests = [...this.requestQueue];
    this.requestQueue = [];
    
    for (const request of requests) {
      try {
        // Only process recent requests (within last hour)
        if (Date.now() - request.timestamp < 60 * 60 * 1000) {
          await fetch(request.url, request.options);
        }
      } catch (error) {
        console.error('Failed to process queued request:', error);
      }
    }
  }

  /**
   * Check if should retry request
   */
  shouldRetry(url, method, status) {
    const key = `${method}:${url}`;
    const attempts = this.retryAttempts.get(key) || 0;
    
    // Retry on 5xx errors or network errors, max 3 attempts
    if ((status >= 500 || status === 0) && attempts < 3) {
      this.retryAttempts.set(key, attempts + 1);
      return true;
    }
    
    // Reset retry count on success
    if (status >= 200 && status < 300) {
      this.retryAttempts.delete(key);
    }
    
    return false;
  }

  /**
   * Get retry delay (exponential backoff)
   */
  getRetryDelay(url, method) {
    const key = `${method}:${url}`;
    const attempts = this.retryAttempts.get(key) || 0;
    return Math.min(1000 * Math.pow(2, attempts), 10000); // Max 10 seconds
  }

  /**
   * Generate cache key
   */
  generateCacheKey(url, method, params = {}) {
    const paramString = Object.keys(params).length > 0 ? 
      JSON.stringify(params) : '';
    return `${method}:${url}:${paramString}`;
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const totalEntries = this.cache.size;
    const expiredEntries = Array.from(this.cache.values()).filter(
      entry => Date.now() - entry.timestamp > entry.ttl
    ).length;
    
    return {
      totalEntries,
      activeEntries: totalEntries - expiredEntries,
      expiredEntries,
      hitRate: this.cacheHits / (this.cacheHits + this.cacheMisses) || 0
    };
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics() {
    return {
      timestamp: new Date().toISOString(),
      performance: this.getPerformanceSummary(),
      endpoints: this.getAllMetrics(),
      cache: this.getCacheStats(),
      network: {
        isOnline: this.isOnline,
        queuedRequests: this.requestQueue.length
      }
    };
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.metrics.clear();
    this.cache.clear();
    this.requestQueue = [];
    this.retryAttempts.clear();
  }
}

// Create singleton instance
const apiMonitor = new APIMonitor();

// Enhanced fetch wrapper with monitoring
export const monitoredFetch = async (url, options = {}) => {
  const method = options.method || 'GET';
  const startTime = Date.now();
  
  // Check cache for GET requests
  if (method === 'GET') {
    const cacheKey = apiMonitor.generateCacheKey(url, method, options.params);
    const cached = apiMonitor.getCachedResponse(cacheKey);
    
    if (cached) {
      console.log(`💾 Cache hit for ${method}:${url}`);
      return Promise.resolve(new Response(JSON.stringify(cached), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }));
    }
  }
  
  try {
    const response = await fetch(url, options);
    const endTime = Date.now();
    
    // Monitor the request
    apiMonitor.monitorRequest(url, method, startTime, endTime, response.status);
    
    // Cache successful GET responses
    if (method === 'GET' && response.ok) {
      const clonedResponse = response.clone();
      const data = await clonedResponse.json();
      const cacheKey = apiMonitor.generateCacheKey(url, method, options.params);
      apiMonitor.cacheResponse(cacheKey, data);
    }
    
    return response;
  } catch (error) {
    const endTime = Date.now();
    
    // Monitor the failed request
    apiMonitor.monitorRequest(url, method, startTime, endTime, 0, error);
    
    // Queue request if offline
    if (!apiMonitor.isOnline) {
      apiMonitor.queueRequest({ url, options });
    }
    
    throw error;
  }
};

export default apiMonitor;
