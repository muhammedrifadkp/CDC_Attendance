# Deployment Checklist for Keep-Alive Service

## Pre-Deployment Verification

### ✅ Code Integration
- [ ] Keep-alive service files are present:
  - [ ] `services/keepAliveService.js`
  - [ ] `utils/keepAliveLogger.js`
  - [ ] `routes/keepAliveRoutes.js`
- [ ] Server.js integration:
  - [ ] Keep-alive routes imported and registered
  - [ ] Service initialization in production mode
  - [ ] Health endpoint includes keep-alive status
- [ ] Dependencies installed:
  - [ ] `node-cron` package added to package.json
  - [ ] All dependencies up to date

### ✅ Environment Configuration
- [ ] Production environment variables set:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT` configured (usually 10000 for Render)
  - [ ] Optional: `ENABLE_KEEP_ALIVE=true` (if needed for testing)
  - [ ] Optional: `RENDER_EXTERNAL_URL` (auto-detected on Render)
  - [ ] Optional: `KEEP_ALIVE_EXTERNAL_URLS` (for external monitoring)

## Render Deployment Configuration

### ✅ Service Settings
- [ ] **Build Command**: `cd backend && npm install`
- [ ] **Start Command**: `cd backend && npm start`
- [ ] **Health Check Path**: `/api/health`
- [ ] **Environment**: `node`
- [ ] **Region**: Choose appropriate region

### ✅ Environment Variables in Render
```env
NODE_ENV=production
PORT=10000
MONGO_URI=mongodb+srv://your-connection-string
JWT_SECRET=your-production-jwt-secret
FRONTEND_URL=https://your-frontend.vercel.app
CORS_ORIGINS=https://your-frontend.vercel.app,https://your-domain.com
EMAIL_ENABLED=true
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-app-password
ENABLE_RATE_LIMITING=true
```

## Post-Deployment Verification

### ✅ Service Health Checks
Test these endpoints after deployment:

1. **Basic Health Check**
   ```bash
   curl https://your-backend.onrender.com/api/health
   ```
   - [ ] Returns 200 status
   - [ ] Includes keep-alive service status
   - [ ] Database connection is healthy

2. **Keep-Alive Ping**
   ```bash
   curl https://your-backend.onrender.com/api/keep-alive/ping
   ```
   - [ ] Returns 200 status
   - [ ] Shows service information
   - [ ] Includes timestamp and uptime

3. **Keep-Alive Status**
   ```bash
   curl https://your-backend.onrender.com/api/keep-alive/status
   ```
   - [ ] Service is running (`isRunning: true`)
   - [ ] Self-ping URL is correct
   - [ ] Statistics are being tracked

4. **Keep-Alive Statistics**
   ```bash
   curl https://your-backend.onrender.com/api/keep-alive/stats
   ```
   - [ ] Shows performance metrics
   - [ ] Success rate is tracked
   - [ ] Response times are recorded

### ✅ Monitoring Setup
- [ ] **Initial Ping**: Service performs first ping within 5 seconds
- [ ] **Scheduled Pings**: Verify pings occur every 10 minutes
- [ ] **Log Monitoring**: Check Render logs for keep-alive messages:
  ```
  info: Keep-alive service started
  info: Keep-alive ping successful
  ```
- [ ] **Error Handling**: Verify retry logic works if ping fails

### ✅ Performance Verification
- [ ] **Response Time**: Keep-alive pings complete within 30 seconds
- [ ] **Success Rate**: Maintain >95% success rate over 24 hours
- [ ] **Memory Usage**: No memory leaks from keep-alive service
- [ ] **CPU Impact**: Minimal CPU usage during ping operations

## Troubleshooting Guide

### Common Issues and Solutions

#### 🔴 Service Not Starting
**Symptoms**: Keep-alive service shows as "stopped" in status
**Solutions**:
- [ ] Verify `NODE_ENV=production` is set
- [ ] Check server logs for initialization errors
- [ ] Ensure all dependencies are installed

#### 🔴 Ping Failures (404 Errors)
**Symptoms**: Keep-alive pings return 404 Not Found
**Solutions**:
- [ ] Verify keep-alive routes are registered in server.js
- [ ] Check that `/api/keep-alive` prefix is correct
- [ ] Ensure deployment includes all route files

#### 🔴 SSL/TLS Errors
**Symptoms**: EPROTO or SSL handshake errors
**Solutions**:
- [ ] Verify correct protocol (https for production)
- [ ] Check if Render external URL is properly configured
- [ ] Ensure self-ping URL construction is correct

#### 🔴 High Failure Rate
**Symptoms**: Success rate below 90%
**Solutions**:
- [ ] Check network connectivity
- [ ] Increase timeout settings if needed
- [ ] Monitor Render service health
- [ ] Verify no rate limiting issues

### Monitoring Commands

#### Check Service Status
```bash
# Get detailed status
curl -s https://your-backend.onrender.com/api/keep-alive/status | jq '.'

# Get health summary
curl -s https://your-backend.onrender.com/api/keep-alive/health | jq '.'
```

#### Manual Testing
```bash
# Trigger manual ping
curl -X POST https://your-backend.onrender.com/api/keep-alive/manual-ping

# Reset statistics (for testing)
curl -X POST https://your-backend.onrender.com/api/keep-alive/reset-stats
```

#### Monitor Logs
```bash
# In Render dashboard, check logs for:
# - "Keep-alive service started"
# - "Keep-alive ping successful"
# - Any error messages
```

## Success Criteria

### ✅ Deployment Successful When:
- [ ] All health check endpoints return 200
- [ ] Keep-alive service shows as "running"
- [ ] First ping completes successfully within 5 seconds
- [ ] Scheduled pings occur every 10 minutes
- [ ] Success rate remains above 95%
- [ ] No memory leaks or performance issues
- [ ] Render service stays active (no auto-shutdown)

### ✅ Long-term Monitoring:
- [ ] Service uptime > 99.5% over 7 days
- [ ] Average response time < 5 seconds
- [ ] No failed deployments due to keep-alive issues
- [ ] Render service remains active during low-traffic periods

## Emergency Procedures

### If Keep-Alive Fails Completely:
1. **Immediate**: Check Render service status and logs
2. **Short-term**: Manually ping the service to keep it alive
3. **Fix**: Deploy hotfix or rollback to previous version
4. **Monitor**: Verify fix resolves the issue

### If High Failure Rate:
1. **Investigate**: Check logs for specific error patterns
2. **Adjust**: Increase timeout or retry settings if needed
3. **Monitor**: Track improvement in success rate
4. **Document**: Record issue and solution for future reference

---

**Note**: This checklist should be completed for every production deployment to ensure the keep-alive service functions correctly and prevents Render from shutting down the backend due to inactivity.
