const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Force use the production MongoDB URI
process.env.MONGO_URI = 'mongodb+srv://muhammedrifadkp3:merntest@tseepacademy.rxgap.mongodb.net/cadd_attendance';

// Department model schema
const departmentSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

const Department = mongoose.model('Department', departmentSchema);

const createDefaultDepartments = async () => {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check existing departments
    const existingDepartments = await Department.find({});
    console.log(`📊 Found ${existingDepartments.length} existing departments`);

    if (existingDepartments.length > 0) {
      console.log('\n📋 Existing Departments:');
      existingDepartments.forEach(dept => {
        console.log(`   - ${dept.name} (${dept.code}) - ${dept.isActive ? 'Active' : 'Inactive'}`);
      });
    }

    // Default departments to create
    const defaultDepartments = [
      {
        name: 'Computer Science',
        code: 'CS',
        description: 'Computer Science and Programming courses'
      },
      {
        name: 'Mechanical Engineering',
        code: 'ME',
        description: 'Mechanical Engineering and CAD courses'
      },
      {
        name: 'Civil Engineering',
        code: 'CE',
        description: 'Civil Engineering and AutoCAD courses'
      },
      {
        name: 'Electrical Engineering',
        code: 'EE',
        description: 'Electrical Engineering courses'
      },
      {
        name: 'General',
        code: 'GEN',
        description: 'General courses and administration'
      }
    ];

    console.log('\n🔧 Creating default departments...');

    for (const deptData of defaultDepartments) {
      try {
        // Check if department already exists
        const existing = await Department.findOne({
          $or: [
            { name: deptData.name },
            { code: deptData.code }
          ]
        });

        if (existing) {
          console.log(`   ⚠️ Department "${deptData.name}" already exists`);
        } else {
          const newDept = await Department.create(deptData);
          console.log(`   ✅ Created department: ${newDept.name} (${newDept.code})`);
        }
      } catch (error) {
        console.log(`   ❌ Error creating department "${deptData.name}":`, error.message);
      }
    }

    // Show final list
    const finalDepartments = await Department.find({});
    console.log(`\n🎉 Total departments in database: ${finalDepartments.length}`);
    console.log('\n📋 All Departments:');
    finalDepartments.forEach(dept => {
      console.log(`   - ${dept.name} (${dept.code}) - ID: ${dept._id}`);
    });

    console.log('\n✅ Department setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up departments:', error);
    process.exit(1);
  }
};

createDefaultDepartments();
