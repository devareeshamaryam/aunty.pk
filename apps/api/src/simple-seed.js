const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Simple User schema for seeding
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  name: { type: String },
  role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
  refreshToken: { type: String },
}, {
  timestamps: true,
});

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

const User = mongoose.model('User', userSchema);

async function seedAdmin() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/ecom');
    console.log('✅ Connected to MongoDB');

    const adminEmail = 'user@gmail.com';
    const adminPassword = 'areesha12345';

    // Check if admin already exists
    const existing = await User.findOne({ email: adminEmail });
    
    if (existing) {
      console.log('✅ Admin user already exists!');
      console.log('📧 Email:', adminEmail);
      console.log('🔑 Password:', adminPassword);
      console.log('🌐 Login at: http://localhost:3000/auth/login');
      await mongoose.connection.close();
      return;
    }

    // Create admin user
    const admin = new User({
      email: adminEmail,
      passwordHash: adminPassword, // pre-save hook will hash this
      name: 'Admin',
      role: 'ADMIN',
    });

    await admin.save();

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('🌐 Login at: http://localhost:3000/auth/login');
    console.log('\n⚠️  This is the ONLY user account in the system.');
    console.log('   No registration is allowed - admin only system.');

    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    
  } catch (error) {
    console.error('❌ Error seeding admin:', error.message);
    process.exit(1);
  }
}

seedAdmin();