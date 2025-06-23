/**
 * Migration: Add Student ID Field
 * 
 * This migration adds a unique studentId field to all existing students
 * and creates the necessary database index.
 * 
 * Changes:
 * 1. Add studentId field to existing students with auto-generated values
 * 2. Create unique index on studentId field
 * 
 * Run this migration after updating the Student model
 */

const mongoose = require('mongoose');

async function up() {
  try {
    console.log('🔄 Starting Student ID field migration...');
    
    const db = mongoose.connection.db;
    const collection = db.collection('students');
    
    // Get all students without studentId
    const studentsWithoutId = await collection.find({ 
      $or: [
        { studentId: { $exists: false } },
        { studentId: null },
        { studentId: '' }
      ]
    }).toArray();
    
    console.log(`📊 Found ${studentsWithoutId.length} students without Student ID`);
    
    if (studentsWithoutId.length > 0) {
      console.log('🔧 Generating Student IDs for existing students...');
      
      // Generate unique student IDs
      const updates = studentsWithoutId.map((student, index) => {
        const studentId = `STU${(index + 1).toString().padStart(4, '0')}`;
        return {
          updateOne: {
            filter: { _id: student._id },
            update: { $set: { studentId: studentId } }
          }
        };
      });
      
      // Perform bulk update
      const result = await collection.bulkWrite(updates);
      console.log(`✅ Updated ${result.modifiedCount} students with Student IDs`);
      
      // Show some examples
      const sampleUpdates = updates.slice(0, 5);
      console.log('📋 Sample Student IDs generated:');
      for (const update of sampleUpdates) {
        const student = studentsWithoutId.find(s => 
          s._id.toString() === update.updateOne.filter._id.toString()
        );
        console.log(`   - ${student.name}: ${update.updateOne.update.$set.studentId}`);
      }
      
      if (studentsWithoutId.length > 5) {
        console.log(`   ... and ${studentsWithoutId.length - 5} more`);
      }
    }
    
    // Check if unique index already exists
    const indexes = await collection.indexes();
    const studentIdIndexExists = indexes.some(idx => 
      idx.key && idx.key.studentId === 1 && idx.unique === true
    );
    
    if (!studentIdIndexExists) {
      console.log('🔧 Creating unique index on studentId field...');
      await collection.createIndex(
        { studentId: 1 }, 
        { 
          unique: true,
          name: 'studentId_1_unique'
        }
      );
      console.log('✅ Successfully created unique index on studentId');
    } else {
      console.log('ℹ️  Unique index on studentId already exists');
    }
    
    // Verify the changes
    const totalStudents = await collection.countDocuments({});
    const studentsWithId = await collection.countDocuments({ 
      studentId: { $exists: true, $ne: null, $ne: '' }
    });
    
    console.log('📊 Migration verification:');
    console.log(`   - Total students: ${totalStudents}`);
    console.log(`   - Students with Student ID: ${studentsWithId}`);
    
    if (totalStudents === studentsWithId) {
      console.log('✅ All students now have unique Student IDs');
    } else {
      console.log('⚠️  Some students still missing Student IDs');
    }
    
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function down() {
  try {
    console.log('🔄 Rolling back Student ID field migration...');
    
    const db = mongoose.connection.db;
    const collection = db.collection('students');
    
    // Drop the unique index
    console.log('🗑️  Dropping unique index on studentId...');
    try {
      await collection.dropIndex('studentId_1_unique');
      console.log('✅ Successfully dropped studentId index');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  StudentId index not found (already dropped)');
      } else {
        console.error('❌ Error dropping studentId index:', error.message);
        throw error;
      }
    }
    
    // Remove studentId field from all documents
    console.log('🗑️  Removing studentId field from all students...');
    const result = await collection.updateMany(
      {},
      { $unset: { studentId: "" } }
    );
    console.log(`✅ Removed studentId field from ${result.modifiedCount} students`);
    
    console.log('✅ Rollback completed successfully!');
    console.log('⚠️  Student ID functionality has been removed');
    
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
}

module.exports = { up, down };
