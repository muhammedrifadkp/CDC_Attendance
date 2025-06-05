const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Force use the production MongoDB URI
process.env.MONGO_URI = 'mongodb+srv://muhammedrifadkp3:merntest@tseepacademy.rxgap.mongodb.net/cadd_attendance';

// User model schema (simplified)
const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  role: {
    type: String,
    enum: ['admin', 'teacher'],
    default: 'teacher',
  },
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to check password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

const checkAdminUser = async () => {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find all admin users
    const admins = await User.find({ role: 'admin' }).select('+password');
    
    console.log(`📊 Found ${admins.length} admin user(s):`);
    
    for (const admin of admins) {
      console.log('\n👤 Admin User Details:');
      console.log('   Name:', admin.name);
      console.log('   Email:', admin.email);
      console.log('   Role:', admin.role);
      console.log('   Created:', admin.createdAt);
      
      // Test password
      const testPassword = 'Admin@123';
      const isMatch = await admin.matchPassword(testPassword);
      console.log(`   Password "${testPassword}" matches:`, isMatch ? '✅ YES' : '❌ NO');
      
      if (!isMatch) {
        console.log('   🔧 Resetting password to Admin@123...');
        admin.password = testPassword;
        await admin.save();
        console.log('   ✅ Password reset successfully!');
      }
    }
    
    // If no admin found, create one
    if (admins.length === 0) {
      console.log('\n🔧 No admin users found. Creating default admin...');
      const newAdmin = await User.create({
        name: 'System Administrator',
        email: 'admin@gmail.com',
        password: 'Admin@123',
        role: 'admin'
      });
      console.log('✅ Default admin created:', newAdmin.email);
    }
    
    console.log('\n🎉 Admin user verification complete!');
    console.log('📧 Email: admin@gmail.com');
    console.log('🔑 Password: Admin@123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking admin user:', error);
    process.exit(1);
  }
};

checkAdminUser();
