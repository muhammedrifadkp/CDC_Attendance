# Keep-Alive Service Documentation

## Overview

The Keep-Alive Service is designed to prevent Render from shutting down the CDC Attendance backend due to inactivity. It automatically pings the service every 10 minutes to maintain activity and ensure continuous availability.

## Features

- **Automatic Self-Ping**: Pings the service every 10 minutes
- **Production-Ready**: Automatically enabled in production environments
- **Comprehensive Logging**: Detailed logging with statistics and monitoring
- **Health Monitoring**: Tracks success rates, response times, and service health
- **External Ping Support**: Can ping external URLs if configured
- **Graceful Shutdown**: Properly handles service shutdown
- **RESTful API**: Provides endpoints for monitoring and manual control

## Architecture

### Components

1. **KeepAliveService** (`services/keepAliveService.js`)
   - Main service class that handles the ping scheduling
   - Uses node-cron for scheduling
   - Manages HTTP requests with retry logic

2. **KeepAliveLogger** (`utils/keepAliveLogger.js`)
   - Specialized logger for keep-alive operations
   - Tracks statistics and performance metrics
   - Uses Winston for structured logging

3. **KeepAliveRoutes** (`routes/keepAliveRoutes.js`)
   - RESTful API endpoints for monitoring and control
   - Provides health checks and statistics

## Configuration

### Environment Variables

- `NODE_ENV=production` - Automatically enables keep-alive in production
- `ENABLE_KEEP_ALIVE=true` - Force enable keep-alive in any environment
- `RENDER_EXTERNAL_URL` - External URL for Render deployment (auto-detected)
- `RENDER_SERVICE_URL` - Service URL for Render deployment (auto-detected)
- `KEEP_ALIVE_EXTERNAL_URLS` - Comma-separated list of external URLs to ping

### Default Settings

- **Ping Interval**: Every 10 minutes (`*/10 * * * *`)
- **Timeout**: 30 seconds per request
- **Retry Attempts**: 3 attempts per ping
- **Retry Delay**: 5 seconds between retries

## API Endpoints

### GET /api/keep-alive/ping
Simple ping endpoint that returns service status.

**Response:**
```json
{
  "status": "alive",
  "message": "CDC Attendance Management System is running",
  "timestamp": "2025-06-11T07:09:07.251Z",
  "uptime": 120,
  "environment": "production",
  "version": "1.0.0",
  "memory": {
    "used": 45,
    "total": 67,
    "external": 12
  },
  "service": {
    "name": "cdc-attendance-backend",
    "renderService": "cdc-attendance-backend",
    "region": "oregon"
  }
}
```

### GET /api/keep-alive/status
Detailed service status and configuration.

### GET /api/keep-alive/stats
Comprehensive statistics and performance metrics.

### POST /api/keep-alive/manual-ping
Manually trigger a keep-alive ping.

### GET /api/keep-alive/health
Simple health check for monitoring services.

### POST /api/keep-alive/reset-stats
Reset statistics (useful for testing).

## Usage

### Automatic Initialization

The service automatically initializes when the server starts in production:

```javascript
// In server.js
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_KEEP_ALIVE === 'true') {
  keepAliveService.init();
}
```

### Manual Control

```javascript
const keepAliveService = require('./services/keepAliveService');

// Start the service
keepAliveService.init();

// Get status
const status = keepAliveService.getStatus();

// Stop the service
keepAliveService.stop();
```

## Monitoring

### Health Check Integration

The main health endpoint (`/api/health`) includes keep-alive status:

```json
{
  "services": {
    "keepAlive": {
      "enabled": true,
      "status": "running",
      "stats": {
        "successRate": 100,
        "totalPings": 42,
        "uptime": 420
      }
    }
  }
}
```

### Logging

The service provides structured logging:

```
info: Keep-alive service started
info: Keep-alive ping successful {"responseTime": 85, "successRate": 100}
error: Keep-alive ping failed {"error": "timeout", "attempt": "1/3"}
```

## Deployment

### Render Configuration

The service automatically detects Render deployment and configures appropriate URLs:

- Uses `RENDER_EXTERNAL_URL` if available
- Falls back to `RENDER_SERVICE_URL`
- Uses hardcoded production URL as final fallback

### Environment Setup

For production deployment, ensure:

1. `NODE_ENV=production` is set
2. Service has internet access for self-ping
3. Health check endpoint is configured in Render

## Troubleshooting

### Common Issues

1. **SSL/TLS Errors**: Ensure correct protocol (http/https) for environment
2. **404 Errors**: Verify keep-alive routes are properly registered
3. **Timeout Errors**: Check network connectivity and increase timeout if needed
4. **High Failure Rate**: Monitor logs for specific error patterns

### Debug Mode

Enable debug logging by setting log level to 'debug':

```javascript
// In keepAliveLogger.js
level: 'debug'
```

### Manual Testing

Test the service manually:

```bash
# Test ping endpoint
curl https://your-backend-url.onrender.com/api/keep-alive/ping

# Check service status
curl https://your-backend-url.onrender.com/api/keep-alive/status

# Trigger manual ping
curl -X POST https://your-backend-url.onrender.com/api/keep-alive/manual-ping
```

## Performance Impact

- **Memory Usage**: Minimal (~1-2MB additional)
- **CPU Usage**: Negligible (only during ping operations)
- **Network Usage**: ~1KB per ping (every 10 minutes)
- **Startup Time**: No significant impact

## Security Considerations

- All endpoints are public (no authentication required)
- No sensitive information exposed in responses
- Rate limiting applies to all endpoints
- CORS policies are respected

## Future Enhancements

- [ ] Configurable ping intervals
- [ ] Multiple ping strategies
- [ ] Integration with external monitoring services
- [ ] Advanced failure detection and alerting
- [ ] Ping scheduling based on traffic patterns
