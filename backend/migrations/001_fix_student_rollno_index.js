/**
 * Migration: Fix Student Roll Number Index
 * 
 * This migration changes the roll number uniqueness constraint from global
 * to batch-specific. Roll numbers should be unique within each batch, not globally.
 * 
 * Changes:
 * 1. Drop the existing global unique index on rollNo
 * 2. Create a new compound unique index on rollNo + batch
 * 
 * Run this migration after updating the Student model
 */

const mongoose = require('mongoose');

async function up() {
  try {
    console.log('🔄 Starting Student rollNo index migration...');
    
    const db = mongoose.connection.db;
    const collection = db.collection('students');
    
    // Get existing indexes
    const indexes = await collection.indexes();
    console.log('📋 Current indexes:', indexes.map(idx => ({ name: idx.name, key: idx.key })));
    
    // Check if the old global unique index exists
    const oldIndexExists = indexes.some(idx => 
      idx.name === 'rollNo_1' || 
      (idx.key && idx.key.rollNo === 1 && Object.keys(idx.key).length === 1)
    );
    
    if (oldIndexExists) {
      console.log('🗑️  Dropping old global unique index on rollNo...');
      try {
        await collection.dropIndex('rollNo_1');
        console.log('✅ Successfully dropped old rollNo index');
      } catch (error) {
        if (error.code === 27) {
          console.log('ℹ️  Old rollNo index not found (already dropped)');
        } else {
          console.error('❌ Error dropping old index:', error.message);
          throw error;
        }
      }
    } else {
      console.log('ℹ️  Old global rollNo index not found');
    }
    
    // Check if the new compound index already exists
    const newIndexExists = indexes.some(idx => 
      idx.key && idx.key.rollNo === 1 && idx.key.batch === 1
    );
    
    if (!newIndexExists) {
      console.log('🔧 Creating new compound unique index on rollNo + batch...');
      await collection.createIndex(
        { rollNo: 1, batch: 1 }, 
        { 
          unique: true, 
          sparse: true,
          name: 'rollNo_1_batch_1'
        }
      );
      console.log('✅ Successfully created new compound index');
    } else {
      console.log('ℹ️  New compound index already exists');
    }
    
    // Verify the changes
    const updatedIndexes = await collection.indexes();
    console.log('📋 Updated indexes:', updatedIndexes.map(idx => ({ name: idx.name, key: idx.key })));
    
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function down() {
  try {
    console.log('🔄 Rolling back Student rollNo index migration...');
    
    const db = mongoose.connection.db;
    const collection = db.collection('students');
    
    // Drop the compound index
    console.log('🗑️  Dropping compound unique index on rollNo + batch...');
    try {
      await collection.dropIndex('rollNo_1_batch_1');
      console.log('✅ Successfully dropped compound index');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  Compound index not found (already dropped)');
      } else {
        console.error('❌ Error dropping compound index:', error.message);
        throw error;
      }
    }
    
    // Recreate the old global unique index
    console.log('🔧 Recreating old global unique index on rollNo...');
    await collection.createIndex(
      { rollNo: 1 }, 
      { 
        unique: true, 
        sparse: true,
        name: 'rollNo_1'
      }
    );
    console.log('✅ Successfully recreated old global index');
    
    console.log('✅ Rollback completed successfully!');
    
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
}

module.exports = { up, down };
