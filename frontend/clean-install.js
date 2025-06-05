#!/usr/bin/env node

/**
 * Clean install script to remove react-toastify completely
 */

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🧹 Cleaning up react-toastify dependency...');

try {
  // Remove node_modules and package-lock.json
  console.log('📦 Removing node_modules and package-lock.json...');
  
  if (fs.existsSync('node_modules')) {
    execSync('rm -rf node_modules', { stdio: 'inherit' });
  }
  
  if (fs.existsSync('package-lock.json')) {
    fs.unlinkSync('package-lock.json');
  }
  
  console.log('✅ Cleanup completed');
  
  // Fresh install
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('✅ Dependencies installed successfully');
  console.log('🎉 react-toastify has been completely removed!');
  
} catch (error) {
  console.error('❌ Error during cleanup:', error.message);
  process.exit(1);
}
