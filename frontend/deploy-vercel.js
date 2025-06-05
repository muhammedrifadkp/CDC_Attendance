#!/usr/bin/env node

/**
 * Vercel Deployment Script for CDC Attendance Frontend
 * Automates the deployment process with proper configuration
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 CDC Attendance Frontend - Vercel Deployment Script\n');

// Check if we're in the frontend directory
const currentDir = process.cwd();
const packageJsonPath = path.join(currentDir, 'package.json');

if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ Error: package.json not found. Make sure you\'re in the frontend directory.');
  process.exit(1);
}

// Read package.json to verify it's the frontend
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
if (!packageJson.name.includes('frontend') && !packageJson.dependencies?.react) {
  console.error('❌ Error: This doesn\'t appear to be the frontend directory.');
  process.exit(1);
}

console.log('✅ Frontend directory confirmed');

// Check if Vercel CLI is installed
try {
  execSync('vercel --version', { stdio: 'ignore' });
  console.log('✅ Vercel CLI is installed');
} catch (error) {
  console.log('📦 Installing Vercel CLI...');
  try {
    execSync('npm install -g vercel', { stdio: 'inherit' });
    console.log('✅ Vercel CLI installed successfully');
  } catch (installError) {
    console.error('❌ Failed to install Vercel CLI. Please install manually: npm install -g vercel');
    process.exit(1);
  }
}

// Check if user is logged in to Vercel
try {
  execSync('vercel whoami', { stdio: 'ignore' });
  console.log('✅ Logged in to Vercel');
} catch (error) {
  console.log('🔐 Please login to Vercel...');
  try {
    execSync('vercel login', { stdio: 'inherit' });
    console.log('✅ Logged in to Vercel successfully');
  } catch (loginError) {
    console.error('❌ Failed to login to Vercel');
    process.exit(1);
  }
}

// Build the project
console.log('\n🔨 Building the project...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');
} catch (buildError) {
  console.error('❌ Build failed. Please fix the errors and try again.');
  process.exit(1);
}

// Deploy to Vercel
console.log('\n🚀 Deploying to Vercel...');
try {
  const deployOutput = execSync('vercel --prod', { encoding: 'utf8' });
  console.log('✅ Deployment completed successfully');
  
  // Extract the deployment URL
  const urlMatch = deployOutput.match(/https:\/\/[^\s]+/);
  if (urlMatch) {
    const deploymentUrl = urlMatch[0];
    console.log(`\n🌐 Your application is live at: ${deploymentUrl}`);
    
    // Save deployment info
    const deploymentInfo = {
      url: deploymentUrl,
      timestamp: new Date().toISOString(),
      version: packageJson.version || '1.0.0'
    };
    
    fs.writeFileSync('deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
    console.log('📄 Deployment info saved to deployment-info.json');
  }
  
} catch (deployError) {
  console.error('❌ Deployment failed:', deployError.message);
  process.exit(1);
}

console.log('\n🎉 Deployment completed successfully!');
console.log('\n📋 Next Steps:');
console.log('1. Test your deployed application');
console.log('2. Configure custom domain (optional)');
console.log('3. Set up environment variables for your backend API');
console.log('4. Monitor your application performance');

console.log('\n🔧 Useful Vercel Commands:');
console.log('- vercel --prod          # Deploy to production');
console.log('- vercel env ls          # List environment variables');
console.log('- vercel logs            # View deployment logs');
console.log('- vercel domains         # Manage domains');
console.log('- vercel inspect         # Inspect deployment');

console.log('\n✨ Happy coding!');
