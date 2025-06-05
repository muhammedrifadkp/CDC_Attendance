/**
 * Database Optimization Utilities
 * Provides tools for MongoDB performance optimization and monitoring
 */

const mongoose = require('mongoose');

class DatabaseOptimizer {
  constructor() {
    this.queryMetrics = new Map();
    this.slowQueries = [];
    this.connectionMetrics = {
      totalConnections: 0,
      activeConnections: 0,
      connectionErrors: 0,
      lastConnectionTime: null
    };
  }

  /**
   * Monitor query performance
   */
  monitorQuery(operation, collection, query, duration, error = null) {
    const key = `${operation}:${collection}`;
    
    if (!this.queryMetrics.has(key)) {
      this.queryMetrics.set(key, {
        operation,
        collection,
        totalQueries: 0,
        successfulQueries: 0,
        failedQueries: 0,
        totalDuration: 0,
        averageDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        lastQuery: null,
        errors: []
      });
    }
    
    const metric = this.queryMetrics.get(key);
    metric.totalQueries++;
    metric.totalDuration += duration;
    metric.averageDuration = metric.totalDuration / metric.totalQueries;
    metric.minDuration = Math.min(metric.minDuration, duration);
    metric.maxDuration = Math.max(metric.maxDuration, duration);
    metric.lastQuery = new Date().toISOString();
    
    if (error) {
      metric.failedQueries++;
      metric.errors.push({
        timestamp: new Date().toISOString(),
        error: error.message || String(error),
        query: JSON.stringify(query),
        duration
      });
      
      // Keep only last 10 errors
      if (metric.errors.length > 10) {
        metric.errors.splice(0, metric.errors.length - 10);
      }
    } else {
      metric.successfulQueries++;
    }
    
    // Track slow queries
    if (duration > 1000) { // Queries taking more than 1 second
      this.slowQueries.push({
        timestamp: new Date().toISOString(),
        operation,
        collection,
        query: JSON.stringify(query),
        duration,
        key
      });
      
      // Keep only last 20 slow queries
      if (this.slowQueries.length > 20) {
        this.slowQueries.splice(0, this.slowQueries.length - 20);
      }
      
      console.warn(`🐌 Slow query detected: ${key} took ${duration}ms`);
    }
  }

  /**
   * Create optimized indexes
   */
  async createOptimizedIndexes() {
    try {
      console.log('🔧 Creating optimized database indexes...');
      
      // User indexes
      await mongoose.connection.db.collection('users').createIndex({ email: 1 }, { unique: true });
      await mongoose.connection.db.collection('users').createIndex({ role: 1 });
      await mongoose.connection.db.collection('users').createIndex({ isActive: 1 });
      await mongoose.connection.db.collection('users').createIndex({ createdAt: -1 });
      
      // Student indexes
      await mongoose.connection.db.collection('students').createIndex({ studentId: 1 }, { unique: true });
      await mongoose.connection.db.collection('students').createIndex({ email: 1 }, { unique: true });
      await mongoose.connection.db.collection('students').createIndex({ department: 1 });
      await mongoose.connection.db.collection('students').createIndex({ course: 1 });
      await mongoose.connection.db.collection('students').createIndex({ batch: 1 });
      await mongoose.connection.db.collection('students').createIndex({ isActive: 1 });
      
      // Attendance indexes
      await mongoose.connection.db.collection('attendances').createIndex({ student: 1, date: -1 });
      await mongoose.connection.db.collection('attendances').createIndex({ batch: 1, date: -1 });
      await mongoose.connection.db.collection('attendances').createIndex({ teacher: 1, date: -1 });
      await mongoose.connection.db.collection('attendances').createIndex({ date: -1 });
      await mongoose.connection.db.collection('attendances').createIndex({ status: 1 });
      
      // Batch indexes
      await mongoose.connection.db.collection('batches').createIndex({ batchId: 1 }, { unique: true });
      await mongoose.connection.db.collection('batches').createIndex({ department: 1 });
      await mongoose.connection.db.collection('batches').createIndex({ course: 1 });
      await mongoose.connection.db.collection('batches').createIndex({ teacher: 1 });
      await mongoose.connection.db.collection('batches').createIndex({ isActive: 1 });
      
      // Department indexes
      await mongoose.connection.db.collection('departments').createIndex({ name: 1 }, { unique: true });
      await mongoose.connection.db.collection('departments').createIndex({ code: 1 }, { unique: true });
      await mongoose.connection.db.collection('departments').createIndex({ isActive: 1 });
      
      // Course indexes
      await mongoose.connection.db.collection('courses').createIndex({ name: 1, department: 1 }, { unique: true });
      await mongoose.connection.db.collection('courses').createIndex({ code: 1 }, { unique: true });
      await mongoose.connection.db.collection('courses').createIndex({ department: 1 });
      await mongoose.connection.db.collection('courses').createIndex({ isActive: 1 });
      
      // PC indexes
      await mongoose.connection.db.collection('pcs').createIndex({ pcNumber: 1 }, { unique: true });
      await mongoose.connection.db.collection('pcs').createIndex({ status: 1 });
      await mongoose.connection.db.collection('pcs').createIndex({ assignedTo: 1 });
      
      // Notification indexes
      await mongoose.connection.db.collection('notifications').createIndex({ createdAt: -1 });
      await mongoose.connection.db.collection('notifications').createIndex({ priority: 1 });
      await mongoose.connection.db.collection('notifications').createIndex({ type: 1 });
      await mongoose.connection.db.collection('notifications').createIndex({ recipients: 1 });
      
      console.log('✅ Database indexes created successfully');
      return true;
    } catch (error) {
      console.error('❌ Error creating indexes:', error);
      return false;
    }
  }

  /**
   * Analyze collection performance
   */
  async analyzeCollectionPerformance() {
    try {
      const collections = await mongoose.connection.db.listCollections().toArray();
      const analysis = {};
      
      for (const collection of collections) {
        const collName = collection.name;
        const stats = await mongoose.connection.db.collection(collName).stats();
        const indexes = await mongoose.connection.db.collection(collName).indexes();
        
        analysis[collName] = {
          documentCount: stats.count,
          avgDocumentSize: Math.round(stats.avgObjSize || 0),
          totalSize: Math.round(stats.size / 1024), // KB
          indexCount: indexes.length,
          indexes: indexes.map(idx => ({
            name: idx.name,
            keys: idx.key,
            unique: idx.unique || false
          }))
        };
      }
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing collection performance:', error);
      return {};
    }
  }

  /**
   * Get database connection status
   */
  getConnectionStatus() {
    const connection = mongoose.connection;
    
    return {
      readyState: connection.readyState,
      readyStateText: this.getReadyStateText(connection.readyState),
      host: connection.host,
      port: connection.port,
      name: connection.name,
      collections: Object.keys(connection.collections).length,
      models: Object.keys(connection.models).length
    };
  }

  /**
   * Get readable connection state
   */
  getReadyStateText(state) {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    return states[state] || 'unknown';
  }

  /**
   * Get query performance metrics
   */
  getQueryMetrics() {
    const metrics = {};
    for (const [key, value] of this.queryMetrics.entries()) {
      metrics[key] = { ...value };
    }
    return metrics;
  }

  /**
   * Get slow queries
   */
  getSlowQueries() {
    return [...this.slowQueries];
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const allMetrics = Array.from(this.queryMetrics.values());
    
    if (allMetrics.length === 0) {
      return {
        totalQueries: 0,
        successRate: 0,
        averageQueryTime: 0,
        slowQueries: 0
      };
    }
    
    const totalQueries = allMetrics.reduce((sum, m) => sum + m.totalQueries, 0);
    const totalSuccessful = allMetrics.reduce((sum, m) => sum + m.successfulQueries, 0);
    const successRate = (totalSuccessful / totalQueries) * 100;
    const avgQueryTime = allMetrics.reduce((sum, m) => sum + m.averageDuration, 0) / allMetrics.length;
    
    return {
      totalQueries,
      successRate: Math.round(successRate * 100) / 100,
      averageQueryTime: Math.round(avgQueryTime),
      slowQueries: this.slowQueries.length
    };
  }

  /**
   * Clean up old data
   */
  async cleanupOldData() {
    try {
      console.log('🧹 Starting database cleanup...');
      
      // Clean up old attendance records (older than 2 years)
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      
      const attendanceResult = await mongoose.connection.db.collection('attendances')
        .deleteMany({ date: { $lt: twoYearsAgo } });
      
      // Clean up old notifications (older than 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const notificationResult = await mongoose.connection.db.collection('notifications')
        .deleteMany({ createdAt: { $lt: sixMonthsAgo } });
      
      console.log(`✅ Cleanup completed:`);
      console.log(`   - Removed ${attendanceResult.deletedCount} old attendance records`);
      console.log(`   - Removed ${notificationResult.deletedCount} old notifications`);
      
      return {
        attendanceRecordsRemoved: attendanceResult.deletedCount,
        notificationsRemoved: notificationResult.deletedCount
      };
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      return null;
    }
  }

  /**
   * Export database metrics
   */
  exportMetrics() {
    return {
      timestamp: new Date().toISOString(),
      connection: this.getConnectionStatus(),
      performance: this.getPerformanceSummary(),
      queries: this.getQueryMetrics(),
      slowQueries: this.getSlowQueries()
    };
  }

  /**
   * Reset metrics
   */
  reset() {
    this.queryMetrics.clear();
    this.slowQueries = [];
  }
}

// Create singleton instance
const dbOptimizer = new DatabaseOptimizer();

// Middleware to monitor Mongoose queries
const queryMonitoringMiddleware = function(next) {
  const startTime = Date.now();
  const operation = this.op || this.getQuery ? 'find' : 'unknown';
  const collection = this.model?.collection?.name || 'unknown';
  
  this.then(
    (result) => {
      const duration = Date.now() - startTime;
      dbOptimizer.monitorQuery(operation, collection, this.getQuery(), duration);
    },
    (error) => {
      const duration = Date.now() - startTime;
      dbOptimizer.monitorQuery(operation, collection, this.getQuery(), duration, error);
    }
  );
  
  next();
};

// Apply monitoring to all Mongoose operations
mongoose.plugin(function(schema) {
  schema.pre(['find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany'], queryMonitoringMiddleware);
});

module.exports = dbOptimizer;
