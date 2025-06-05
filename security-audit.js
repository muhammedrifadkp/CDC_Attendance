#!/usr/bin/env node

/**
 * Comprehensive Security Audit Script
 * Analyzes the CDC Attendance system for security vulnerabilities and best practices
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🔒 CDC Attendance Security Audit\n');

class SecurityAuditor {
  constructor() {
    this.findings = [];
    this.score = 100;
    this.criticalIssues = 0;
    this.warningIssues = 0;
    this.infoIssues = 0;
  }

  addFinding(level, category, message, file = null, recommendation = null) {
    this.findings.push({
      level,
      category,
      message,
      file,
      recommendation,
      timestamp: new Date().toISOString()
    });

    switch (level) {
      case 'CRITICAL':
        this.criticalIssues++;
        this.score -= 20;
        break;
      case 'WARNING':
        this.warningIssues++;
        this.score -= 5;
        break;
      case 'INFO':
        this.infoIssues++;
        break;
    }
  }

  // Check environment variables security
  auditEnvironmentVariables() {
    console.log('🔍 Auditing Environment Variables...');
    
    const envFiles = ['backend/.env', 'frontend/.env'];
    
    envFiles.forEach(envFile => {
      if (fs.existsSync(envFile)) {
        const content = fs.readFileSync(envFile, 'utf8');
        
        // Check for weak JWT secrets
        const jwtSecretMatch = content.match(/JWT_SECRET=(.+)/);
        if (jwtSecretMatch) {
          const secret = jwtSecretMatch[1].trim();
          if (secret.length < 32) {
            this.addFinding('CRITICAL', 'Authentication', 
              'JWT secret is too short (< 32 characters)', envFile,
              'Use a strong, randomly generated secret of at least 32 characters');
          } else if (secret === 'your-super-secret-jwt-key' || secret.includes('secret')) {
            this.addFinding('CRITICAL', 'Authentication', 
              'JWT secret appears to be a default or weak value', envFile,
              'Generate a cryptographically secure random secret');
          }
        }
        
        // Check for exposed sensitive data
        const sensitivePatterns = [
          { pattern: /password=.+/i, message: 'Password found in environment file' },
          { pattern: /api_key=.+/i, message: 'API key found in environment file' },
          { pattern: /private_key=.+/i, message: 'Private key found in environment file' }
        ];
        
        sensitivePatterns.forEach(({ pattern, message }) => {
          if (pattern.test(content)) {
            this.addFinding('WARNING', 'Data Exposure', message, envFile,
              'Ensure sensitive data is properly secured and not committed to version control');
          }
        });
        
        // Check for production settings in development
        if (content.includes('NODE_ENV=production') && envFile.includes('backend')) {
          this.addFinding('INFO', 'Configuration', 
            'Production environment detected', envFile,
            'Ensure all production security measures are in place');
        }
      }
    });
  }

  // Check authentication and authorization
  auditAuthentication() {
    console.log('🔍 Auditing Authentication & Authorization...');
    
    // Check auth middleware
    const authMiddlewarePath = 'backend/middleware/authMiddleware.js';
    if (fs.existsSync(authMiddlewarePath)) {
      const content = fs.readFileSync(authMiddlewarePath, 'utf8');
      
      // Check for proper token validation
      if (!content.includes('jwt.verify')) {
        this.addFinding('CRITICAL', 'Authentication', 
          'JWT verification not found in auth middleware', authMiddlewarePath,
          'Implement proper JWT token verification');
      }
      
      // Check for fingerprint validation
      if (content.includes('fingerprint')) {
        this.addFinding('INFO', 'Authentication', 
          'Token fingerprinting implemented - Good security practice', authMiddlewarePath);
      } else {
        this.addFinding('WARNING', 'Authentication', 
          'Token fingerprinting not implemented', authMiddlewarePath,
          'Consider implementing token fingerprinting for enhanced security');
      }
      
      // Check for proper error handling
      if (!content.includes('TokenExpiredError')) {
        this.addFinding('WARNING', 'Authentication', 
          'Specific token error handling not found', authMiddlewarePath,
          'Implement specific handling for different JWT errors');
      }
    }
    
    // Check for role-based access control
    const routeFiles = [
      'backend/routes/userRoutes.js',
      'backend/routes/adminRoutes.js',
      'backend/routes/teacherRoutes.js'
    ];
    
    routeFiles.forEach(routeFile => {
      if (fs.existsSync(routeFile)) {
        const content = fs.readFileSync(routeFile, 'utf8');
        
        if (!content.includes('requireRole') && !content.includes('authorize')) {
          this.addFinding('WARNING', 'Authorization', 
            'Role-based access control not found in routes', routeFile,
            'Implement proper role-based authorization for all routes');
        }
      }
    });
  }

  // Check input validation and sanitization
  auditInputValidation() {
    console.log('🔍 Auditing Input Validation...');
    
    const controllerFiles = fs.readdirSync('backend/controllers')
      .filter(file => file.endsWith('.js'))
      .map(file => path.join('backend/controllers', file));
    
    controllerFiles.forEach(controllerFile => {
      const content = fs.readFileSync(controllerFile, 'utf8');
      
      // Check for input validation
      if (!content.includes('validator') && !content.includes('joi') && !content.includes('express-validator')) {
        this.addFinding('WARNING', 'Input Validation', 
          'No input validation library detected', controllerFile,
          'Implement input validation using libraries like Joi or express-validator');
      }
      
      // Check for SQL injection protection (even though using MongoDB)
      if (content.includes('$where') || content.includes('eval')) {
        this.addFinding('CRITICAL', 'Injection', 
          'Potentially dangerous MongoDB operators found', controllerFile,
          'Avoid using $where and eval operators in MongoDB queries');
      }
      
      // Check for XSS protection
      if (!content.includes('escape') && !content.includes('sanitize')) {
        this.addFinding('WARNING', 'XSS Protection', 
          'No XSS protection detected', controllerFile,
          'Implement input sanitization to prevent XSS attacks');
      }
    });
  }

  // Check CORS and security headers
  auditSecurityHeaders() {
    console.log('🔍 Auditing Security Headers...');
    
    const serverFile = 'backend/server.js';
    if (fs.existsSync(serverFile)) {
      const content = fs.readFileSync(serverFile, 'utf8');
      
      // Check for CORS configuration
      if (content.includes('cors')) {
        this.addFinding('INFO', 'CORS', 
          'CORS middleware detected', serverFile);
        
        // Check for wildcard CORS
        if (content.includes('origin: "*"') || content.includes("origin: '*'")) {
          this.addFinding('CRITICAL', 'CORS', 
            'Wildcard CORS origin detected', serverFile,
            'Specify exact origins instead of using wildcard');
        }
      } else {
        this.addFinding('WARNING', 'CORS', 
          'CORS middleware not found', serverFile,
          'Implement CORS middleware for cross-origin request handling');
      }
      
      // Check for Helmet.js
      if (content.includes('helmet')) {
        this.addFinding('INFO', 'Security Headers', 
          'Helmet.js security headers detected', serverFile);
      } else {
        this.addFinding('WARNING', 'Security Headers', 
          'Helmet.js not found', serverFile,
          'Implement Helmet.js for security headers');
      }
      
      // Check for rate limiting
      if (content.includes('rate-limit') || content.includes('express-rate-limit')) {
        this.addFinding('INFO', 'Rate Limiting', 
          'Rate limiting detected', serverFile);
      } else {
        this.addFinding('WARNING', 'Rate Limiting', 
          'Rate limiting not found', serverFile,
          'Implement rate limiting to prevent abuse');
      }
    }
  }

  // Check for sensitive data exposure
  auditDataExposure() {
    console.log('🔍 Auditing Data Exposure...');
    
    // Check for password hashing
    const userModelPath = 'backend/models/User.js';
    if (fs.existsSync(userModelPath)) {
      const content = fs.readFileSync(userModelPath, 'utf8');
      
      if (content.includes('bcrypt') || content.includes('argon2')) {
        this.addFinding('INFO', 'Password Security', 
          'Password hashing detected', userModelPath);
      } else {
        this.addFinding('CRITICAL', 'Password Security', 
          'Password hashing not found', userModelPath,
          'Implement proper password hashing using bcrypt or argon2');
      }
      
      // Check for password field exclusion
      if (content.includes('select: false') && content.includes('password')) {
        this.addFinding('INFO', 'Data Exposure', 
          'Password field properly excluded from queries', userModelPath);
      } else {
        this.addFinding('WARNING', 'Data Exposure', 
          'Password field may be exposed in queries', userModelPath,
          'Set password field to select: false in schema');
      }
    }
    
    // Check for sensitive data in logs
    const logFiles = ['backend/logs/error.log', 'backend/logs/access.log'];
    logFiles.forEach(logFile => {
      if (fs.existsSync(logFile)) {
        const content = fs.readFileSync(logFile, 'utf8');
        
        if (content.includes('password') || content.includes('token')) {
          this.addFinding('WARNING', 'Data Exposure', 
            'Sensitive data may be logged', logFile,
            'Ensure passwords and tokens are not logged');
        }
      }
    });
  }

  // Check dependencies for vulnerabilities
  auditDependencies() {
    console.log('🔍 Auditing Dependencies...');
    
    const packageFiles = ['backend/package.json', 'frontend/package.json'];
    
    packageFiles.forEach(packageFile => {
      if (fs.existsSync(packageFile)) {
        const packageJson = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        // Check for known vulnerable packages (basic check)
        const vulnerablePackages = [
          'lodash', 'moment', 'request', 'node-uuid'
        ];
        
        vulnerablePackages.forEach(pkg => {
          if (dependencies[pkg]) {
            this.addFinding('WARNING', 'Dependencies', 
              `Potentially vulnerable package detected: ${pkg}`, packageFile,
              `Review ${pkg} for known vulnerabilities and update if necessary`);
          }
        });
        
        // Check for outdated packages (basic version check)
        Object.entries(dependencies).forEach(([pkg, version]) => {
          if (version.startsWith('^0.') || version.startsWith('~0.')) {
            this.addFinding('INFO', 'Dependencies', 
              `Pre-1.0 package detected: ${pkg}@${version}`, packageFile,
              'Consider if pre-1.0 packages are suitable for production');
          }
        });
      }
    });
  }

  // Generate security report
  generateReport() {
    console.log('\n📊 Security Audit Report\n');
    console.log('='.repeat(50));
    
    // Overall score
    const finalScore = Math.max(0, this.score);
    console.log(`🎯 Security Score: ${finalScore}/100`);
    
    if (finalScore >= 90) {
      console.log('✅ Excellent security posture');
    } else if (finalScore >= 70) {
      console.log('⚠️  Good security with room for improvement');
    } else if (finalScore >= 50) {
      console.log('🔶 Moderate security - several issues need attention');
    } else {
      console.log('🚨 Poor security - immediate action required');
    }
    
    console.log(`\n📈 Issue Summary:`);
    console.log(`   🚨 Critical: ${this.criticalIssues}`);
    console.log(`   ⚠️  Warning: ${this.warningIssues}`);
    console.log(`   ℹ️  Info: ${this.infoIssues}`);
    
    // Group findings by category
    const categories = {};
    this.findings.forEach(finding => {
      if (!categories[finding.category]) {
        categories[finding.category] = [];
      }
      categories[finding.category].push(finding);
    });
    
    console.log('\n📋 Detailed Findings:\n');
    
    Object.entries(categories).forEach(([category, findings]) => {
      console.log(`\n🔍 ${category}:`);
      findings.forEach(finding => {
        const icon = finding.level === 'CRITICAL' ? '🚨' : 
                    finding.level === 'WARNING' ? '⚠️' : 'ℹ️';
        console.log(`   ${icon} ${finding.message}`);
        if (finding.file) {
          console.log(`      📁 File: ${finding.file}`);
        }
        if (finding.recommendation) {
          console.log(`      💡 Recommendation: ${finding.recommendation}`);
        }
        console.log('');
      });
    });
    
    // Recommendations
    console.log('\n🎯 Priority Recommendations:\n');
    
    if (this.criticalIssues > 0) {
      console.log('1. 🚨 Address all CRITICAL issues immediately');
      console.log('2. 🔒 Review authentication and authorization mechanisms');
      console.log('3. 🛡️  Implement proper input validation and sanitization');
    }
    
    if (this.warningIssues > 0) {
      console.log('4. ⚠️  Address WARNING issues to improve security posture');
      console.log('5. 📊 Implement comprehensive logging and monitoring');
    }
    
    console.log('6. 🔄 Run security audits regularly');
    console.log('7. 📚 Keep dependencies updated');
    console.log('8. 🧪 Implement security testing in CI/CD pipeline');
    
    return {
      score: finalScore,
      criticalIssues: this.criticalIssues,
      warningIssues: this.warningIssues,
      infoIssues: this.infoIssues,
      findings: this.findings
    };
  }

  // Run complete audit
  runAudit() {
    this.auditEnvironmentVariables();
    this.auditAuthentication();
    this.auditInputValidation();
    this.auditSecurityHeaders();
    this.auditDataExposure();
    this.auditDependencies();
    
    return this.generateReport();
  }
}

// Run the audit
const auditor = new SecurityAuditor();
const report = auditor.runAudit();

// Save report to file
const reportData = {
  timestamp: new Date().toISOString(),
  ...report
};

fs.writeFileSync('security-audit-report.json', JSON.stringify(reportData, null, 2));
console.log('\n💾 Detailed report saved to: security-audit-report.json');
