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

const createDefaultAdmin = async () => {
  try {
    console.log('🔧 Connecting to MongoDB...');
    console.log('🔗 MONGO_URI:', process.env.MONGO_URI ? 'Set' : 'Not set');
    console.log('🔗 Using URI:', process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@gmail.com' });
    
    if (existingAdmin) {
      console.log('ℹ️ Admin user already exists with email: admin@gmail.com');
      console.log('🔑 If you forgot the password, you can reset it through the forgot password feature');
      process.exit(0);
    }

    // Create default admin
    const defaultAdmin = {
      name: 'System Administrator',
      email: 'admin@gmail.com',
      password: 'Admin@123',
      role: 'admin'
    };

    const admin = await User.create(defaultAdmin);
    
    console.log('🎉 Default admin user created successfully!');
    console.log('📧 Email: admin@gmail.com');
    console.log('🔑 Password: Admin@123');
    console.log('⚠️ Please change the password after first login');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating default admin:', error);
    process.exit(1);
  }
};

createDefaultAdmin();
