/**
 * Migration: Make Student Email Optional
 * 
 * This migration updates the email index to be sparse, allowing null values
 * since email is now optional for students.
 * 
 * Changes:
 * 1. Drop the existing unique index on email
 * 2. Create a new sparse unique index on email (allows null values)
 * 
 * Run this migration after updating the Student model
 */

const mongoose = require('mongoose');

async function up() {
  try {
    console.log('🔄 Starting Student email index migration...');
    
    const db = mongoose.connection.db;
    const collection = db.collection('students');
    
    // Get existing indexes
    const indexes = await collection.indexes();
    console.log('📋 Current indexes:', indexes.map(idx => ({ name: idx.name, key: idx.key, unique: idx.unique, sparse: idx.sparse })));
    
    // Check if the old email index exists (non-sparse)
    const oldEmailIndex = indexes.find(idx => 
      idx.key && idx.key.email === 1 && idx.unique === true && !idx.sparse
    );
    
    if (oldEmailIndex) {
      console.log('🗑️  Dropping old non-sparse unique index on email...');
      try {
        await collection.dropIndex('email_1');
        console.log('✅ Successfully dropped old email index');
      } catch (error) {
        if (error.code === 27) {
          console.log('ℹ️  Old email index not found (already dropped)');
        } else {
          console.error('❌ Error dropping old index:', error.message);
          throw error;
        }
      }
    } else {
      console.log('ℹ️  Old non-sparse email index not found');
    }
    
    // Check if the new sparse index already exists
    const newEmailIndex = indexes.find(idx => 
      idx.key && idx.key.email === 1 && idx.unique === true && idx.sparse === true
    );
    
    if (!newEmailIndex) {
      console.log('🔧 Creating new sparse unique index on email...');
      await collection.createIndex(
        { email: 1 }, 
        { 
          unique: true, 
          sparse: true,
          name: 'email_1_sparse'
        }
      );
      console.log('✅ Successfully created new sparse email index');
    } else {
      console.log('ℹ️  New sparse email index already exists');
    }
    
    // Verify the changes
    const updatedIndexes = await collection.indexes();
    console.log('📋 Updated indexes:', updatedIndexes.map(idx => ({ name: idx.name, key: idx.key, unique: idx.unique, sparse: idx.sparse })));
    
    console.log('✅ Migration completed successfully!');
    console.log('ℹ️  Students can now be created without email addresses');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function down() {
  try {
    console.log('🔄 Rolling back Student email index migration...');
    
    const db = mongoose.connection.db;
    const collection = db.collection('students');
    
    // Drop the sparse index
    console.log('🗑️  Dropping sparse unique index on email...');
    try {
      await collection.dropIndex('email_1_sparse');
      console.log('✅ Successfully dropped sparse email index');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  Sparse email index not found (already dropped)');
      } else {
        console.error('❌ Error dropping sparse index:', error.message);
        throw error;
      }
    }
    
    // Recreate the old non-sparse unique index
    console.log('🔧 Recreating old non-sparse unique index on email...');
    await collection.createIndex(
      { email: 1 }, 
      { 
        unique: true, 
        sparse: false,
        name: 'email_1'
      }
    );
    console.log('✅ Successfully recreated old non-sparse email index');
    
    console.log('✅ Rollback completed successfully!');
    console.log('⚠️  Email is now required again for all students');
    
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
}

module.exports = { up, down };
