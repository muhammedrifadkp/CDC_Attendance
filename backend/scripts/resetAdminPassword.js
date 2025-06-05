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

const User = mongoose.model('User', userSchema);

const resetAdminPassword = async () => {
  try {
    console.log('🔧 Connecting to MongoDB...');
    console.log('🔗 Using URI:', process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find admin user
    const admin = await User.findOne({ email: 'admin@gmail.com' }).select('+password');
    
    if (!admin) {
      console.log('❌ Admin user not found with email: admin@gmail.com');
      process.exit(1);
    }

    console.log('👤 Found admin user:', admin.name);

    // Reset password to Admin@123
    const newPassword = 'Admin@123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    admin.password = hashedPassword;
    await admin.save();
    
    console.log('🎉 Admin password reset successfully!');
    console.log('📧 Email: admin@gmail.com');
    console.log('🔑 Password: Admin@123');
    console.log('✅ You can now login with these credentials');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting admin password:', error);
    process.exit(1);
  }
};

resetAdminPassword();
