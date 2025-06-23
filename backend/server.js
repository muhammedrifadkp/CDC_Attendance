const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

// Import routes
const userRoutes = require('./routes/userRoutes');
const batchRoutes = require('./routes/batchRoutes');
const studentRoutes = require('./routes/studentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const courseRoutes = require('./routes/courseRoutes');
const labRoutes = require('./routes/labRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const keepAliveRoutes = require('./routes/keepAliveRoutes');

// Import keep-alive service
const keepAliveService = require('./services/keepAliveService');

// Load environment variables
dotenv.config();

// Environment validation and logging
console.log('🔧 Environment Configuration:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`   PORT: ${process.env.PORT || 5000}`);
console.log(`   FRONTEND_URL: ${process.env.FRONTEND_URL || 'Not set'}`);
console.log(`   MONGO_URI: ${process.env.MONGO_URI ? 'Configured' : 'Not configured'}`);
console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? 'Configured' : 'Not configured'}`);
console.log(`   EMAIL_ENABLED: ${process.env.EMAIL_ENABLED || 'Not set'}`);
console.log(`   EMAIL_SERVICE: ${process.env.EMAIL_SERVICE || 'Not set'}`);
console.log(`   EMAIL_USER: ${process.env.EMAIL_USER ? 'Configured' : 'Not configured'}`);

// Connect to database
connectDB();

const app = express();

// CORS - Must be before other middleware
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://localhost:5173', // Vite default port
      process.env.FRONTEND_URL,
      process.env.PROD_FRONTEND_URL
    ].filter(Boolean);

console.log('🔗 CORS Origins configured:', corsOrigins);

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'X-File-Name'
  ],
  exposedHeaders: ['set-cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.emailjs.com"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Input validation and sanitization middleware
const { sanitizeInputs, preventMongoInjection } = require('./middleware/validationMiddleware');
app.use(sanitizeInputs);
app.use(preventMongoInjection);

// Enhanced security middleware
const {
  securityHeaders,
  suspiciousUserAgentDetection,
  sqlInjectionDetection,
  xssDetection,
  authFailureMonitoring,
  requestSizeMonitoring
} = require('./middleware/securityMiddleware');

app.use(securityHeaders);
app.use(suspiciousUserAgentDetection);
app.use(requestSizeMonitoring);
app.use(sqlInjectionDetection);
app.use(xssDetection);
app.use(authFailureMonitoring);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Enhanced rate limiting (only in production or when explicitly enabled)
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_RATE_LIMITING === 'true') {
  const {
    apiRateLimiter,
    burstProtectionRateLimiter
  } = require('./middleware/rateLimitMiddleware');

  console.log('🛡️ Rate limiting enabled');

  // Apply burst protection globally
  app.use(burstProtectionRateLimiter);

  // Apply general API rate limiting
  app.use('/api', apiRateLimiter);
} else {
  console.log('⚠️ Rate limiting disabled for development');
}

// Handle preflight requests
app.options('*', cors());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/lab', labRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/keep-alive', keepAliveRoutes);

// Health check endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'CDC Attendance Management System API is running!',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 5000,
    environment: process.env.NODE_ENV || 'development',
    status: 'healthy'
  });
});



// Comprehensive health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const errorLogger = require('./utils/errorLogger');
    const keepAliveLogger = require('./utils/keepAliveLogger');

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: {
          status: 'unknown',
          connection: mongoose.connection.readyState,
          host: mongoose.connection.host || 'unknown'
        },
        email: {
          status: process.env.EMAIL_ENABLED === 'true' ? 'enabled' : 'disabled',
          service: process.env.EMAIL_SERVICE || 'not configured'
        },
        security: {
          rateLimiting: process.env.NODE_ENV === 'production' || process.env.ENABLE_RATE_LIMITING === 'true',
          cors: true,
          helmet: true
        },
        keepAlive: {
          enabled: process.env.NODE_ENV === 'production' || process.env.ENABLE_KEEP_ALIVE === 'true',
          status: keepAliveService.getStatus().isRunning ? 'running' : 'stopped',
          stats: keepAliveLogger.getStats()
        }
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform
      }
    };

    // Check database connection
    if (mongoose.connection.readyState === 1) {
      health.services.database.status = 'connected';
    } else if (mongoose.connection.readyState === 2) {
      health.services.database.status = 'connecting';
    } else {
      health.services.database.status = 'disconnected';
      health.status = 'degraded';
    }

    // Get error statistics
    const errorStats = errorLogger.getErrorStats(24);
    health.errors = {
      last24Hours: errorStats.total,
      byType: errorStats.byType
    };

    // Determine overall status
    if (health.services.database.status === 'disconnected') {
      health.status = 'unhealthy';
    } else if (errorStats.total > 50) {
      health.status = 'degraded';
    }

    res.json(health);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Error handler
app.use(errorHandler);

// Global error handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);

  // Initialize keep-alive service after server starts
  // Only in production or when explicitly enabled
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_KEEP_ALIVE === 'true') {
    console.log('🔄 Initializing keep-alive service...');
    keepAliveService.init();
  } else {
    console.log('⚠️ Keep-alive service disabled for development');
  }
});
