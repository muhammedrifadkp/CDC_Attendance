/**
 * Migration Runner Script
 * 
 * Usage:
 * node scripts/run-migration.js up 001_fix_student_rollno_index
 * node scripts/run-migration.js down 001_fix_student_rollno_index
 */

const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config();

async function runMigration() {
  const [,, direction, migrationName] = process.argv;
  
  if (!direction || !migrationName) {
    console.error('Usage: node scripts/run-migration.js <up|down> <migration-name>');
    process.exit(1);
  }
  
  if (!['up', 'down'].includes(direction)) {
    console.error('Direction must be either "up" or "down"');
    process.exit(1);
  }
  
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Load and run migration
    const migrationPath = path.join(__dirname, '..', 'migrations', `${migrationName}.js`);
    console.log(`📂 Loading migration: ${migrationPath}`);
    
    const migration = require(migrationPath);
    
    if (typeof migration[direction] !== 'function') {
      throw new Error(`Migration ${migrationName} does not have a ${direction} function`);
    }
    
    console.log(`🚀 Running migration ${migrationName} (${direction})...`);
    await migration[direction]();
    
    console.log(`✅ Migration ${migrationName} (${direction}) completed successfully!`);
    
  } catch (error) {
    console.error(`❌ Migration failed:`, error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

runMigration();
