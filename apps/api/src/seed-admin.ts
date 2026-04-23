import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';

async function seedAdmin() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userModel = app.get(getModelToken('User'));

  const adminEmail = 'user@gmail.com';
  const adminPassword = 'areesha12345';

  // Check if admin already exists
  const existing = await userModel.findOne({ email: adminEmail });
  
  if (existing) {
    console.log('✅ Admin user already exists!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('🌐 Login at: http://localhost:3000/auth/login');
    await app.close();
    return;
  }

  // Create the ONLY admin user for this system
  const admin = new userModel({
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

  await app.close();
}

seedAdmin().catch((error) => {
  console.error('Error seeding admin:', error);
  process.exit(1);
});
