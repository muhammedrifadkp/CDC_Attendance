#!/usr/bin/env node

/**
 * Keep-Alive Service Verification Script
 * 
 * This script verifies that the keep-alive service is working correctly
 * in production. It can be run locally to test a deployed backend.
 * 
 * Usage:
 *   node scripts/verify-keep-alive.js [backend-url]
 * 
 * Example:
 *   node scripts/verify-keep-alive.js https://cdc-attendance-backend.onrender.com
 */

const https = require('https');
const http = require('http');

// Configuration
const DEFAULT_BACKEND_URL = 'https://cdc-attendance-backend.onrender.com';
const TIMEOUT = 30000; // 30 seconds

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const httpModule = isHttps ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      timeout: TIMEOUT,
      headers: {
        'User-Agent': 'Keep-Alive-Verifier/1.0',
        'Accept': 'application/json'
      }
    };

    const startTime = Date.now();
    const req = httpModule.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData,
            responseTime,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            responseTime,
            headers: res.headers,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject({
        error: error.message,
        code: error.code,
        responseTime: Date.now() - startTime
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject({
        error: 'Request timeout',
        code: 'TIMEOUT',
        responseTime: TIMEOUT
      });
    });

    req.end();
  });
}

async function testEndpoint(baseUrl, endpoint, description) {
  const url = `${baseUrl}${endpoint}`;
  log(`\n🔄 Testing ${description}...`, 'blue');
  log(`   URL: ${url}`, 'yellow');
  
  try {
    const result = await makeRequest(url);
    
    if (result.status === 200) {
      log(`   ✅ SUCCESS (${result.responseTime}ms)`, 'green');
      return { success: true, ...result };
    } else {
      log(`   ❌ FAILED - HTTP ${result.status} (${result.responseTime}ms)`, 'red');
      return { success: false, ...result };
    }
  } catch (error) {
    log(`   ❌ ERROR - ${error.error} (${error.responseTime}ms)`, 'red');
    return { success: false, ...error };
  }
}

async function verifyKeepAlive(backendUrl) {
  log(`${colors.bold}🔍 Keep-Alive Service Verification${colors.reset}`, 'blue');
  log(`Backend URL: ${backendUrl}\n`, 'yellow');
  
  const tests = [
    {
      endpoint: '/api/health',
      description: 'System Health Check',
      required: true
    },
    {
      endpoint: '/api/keep-alive/ping',
      description: 'Keep-Alive Ping',
      required: true
    },
    {
      endpoint: '/api/keep-alive/status',
      description: 'Keep-Alive Status',
      required: true
    },
    {
      endpoint: '/api/keep-alive/stats',
      description: 'Keep-Alive Statistics',
      required: false
    },
    {
      endpoint: '/api/keep-alive/health',
      description: 'Keep-Alive Health Check',
      required: false
    }
  ];
  
  const results = [];
  let criticalFailures = 0;
  
  for (const test of tests) {
    const result = await testEndpoint(backendUrl, test.endpoint, test.description);
    results.push({ ...test, result });
    
    if (!result.success && test.required) {
      criticalFailures++;
    }
    
    // Show relevant data for successful tests
    if (result.success && result.data) {
      if (test.endpoint === '/api/keep-alive/status') {
        const status = result.data.keepAlive || result.data;
        if (status.service) {
          log(`   📊 Service Running: ${status.service.isRunning}`, 'green');
          log(`   📍 Self-Ping URL: ${status.service.selfPingUrl}`, 'green');
        }
      } else if (test.endpoint === '/api/keep-alive/stats') {
        const stats = result.data.statistics || result.data;
        if (stats.performance) {
          log(`   📈 Success Rate: ${stats.performance.successRate}%`, 'green');
          log(`   ⏱️  Avg Response: ${stats.performance.averageResponseTime}ms`, 'green');
          log(`   📊 Total Pings: ${stats.performance.totalRequests}`, 'green');
        }
      } else if (test.endpoint === '/api/health') {
        const health = result.data;
        if (health.services && health.services.keepAlive) {
          log(`   🔄 Keep-Alive Enabled: ${health.services.keepAlive.enabled}`, 'green');
          log(`   📊 Keep-Alive Status: ${health.services.keepAlive.status}`, 'green');
        }
      }
    }
  }
  
  // Summary
  log(`\n${colors.bold}📋 VERIFICATION SUMMARY${colors.reset}`, 'blue');
  log(`Total Tests: ${tests.length}`, 'yellow');
  log(`Successful: ${results.filter(r => r.result.success).length}`, 'green');
  log(`Failed: ${results.filter(r => !r.result.success).length}`, 'red');
  log(`Critical Failures: ${criticalFailures}`, criticalFailures > 0 ? 'red' : 'green');
  
  if (criticalFailures === 0) {
    log(`\n🎉 VERIFICATION PASSED - Keep-Alive service is working correctly!`, 'green');
    
    // Trigger a manual ping for good measure
    log(`\n🔄 Triggering manual ping...`, 'blue');
    try {
      const pingResult = await makeRequest(`${backendUrl}/api/keep-alive/manual-ping`, 'POST');
      if (pingResult.status === 200) {
        log(`✅ Manual ping triggered successfully`, 'green');
      } else {
        log(`⚠️  Manual ping returned HTTP ${pingResult.status}`, 'yellow');
      }
    } catch (error) {
      log(`⚠️  Manual ping failed: ${error.error}`, 'yellow');
    }
    
    return true;
  } else {
    log(`\n❌ VERIFICATION FAILED - ${criticalFailures} critical issues found`, 'red');
    log(`\n🔧 Troubleshooting steps:`, 'yellow');
    log(`1. Check if the backend is deployed and running`, 'yellow');
    log(`2. Verify keep-alive routes are properly registered`, 'yellow');
    log(`3. Check environment variables (NODE_ENV=production)`, 'yellow');
    log(`4. Review deployment logs for errors`, 'yellow');
    return false;
  }
}

// Main execution
async function main() {
  const backendUrl = process.argv[2] || DEFAULT_BACKEND_URL;
  
  try {
    const success = await verifyKeepAlive(backendUrl);
    process.exit(success ? 0 : 1);
  } catch (error) {
    log(`\n💥 Unexpected error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  log(`\n💥 Unhandled Rejection: ${reason}`, 'red');
  process.exit(1);
});

// Run the script
if (require.main === module) {
  main();
}

module.exports = { verifyKeepAlive, testEndpoint };
