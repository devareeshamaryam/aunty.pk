import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getModelToken } from '@nestjs/mongoose';

async function seedAdmin() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userModel = app.get(getModelToken('User'));

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || 'Admin';

  if (!adminEmail || !adminPassword) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
    await app.close();
    process.exit(1);
  }

  if (adminPassword.length < 8) {
    console.error('ADMIN_PASSWORD must be at least 8 characters');
    await app.close();
    process.exit(1);
  }

  const existing = await userModel.findOne({ email: adminEmail.toLowerCase() });

  if (existing) {
    console.log(`Admin user already exists: ${adminEmail}`);
    await app.close();
    return;
  }

  const admin = new userModel({
    email: adminEmail.toLowerCase(),
    passwordHash: adminPassword,
    name: adminName,
    role: 'ADMIN',
  });

  await admin.save();

  console.log(`Admin user created: ${adminEmail}`);
  console.log('Login at: http://localhost:3000/auth/login');

  await app.close();
}

seedAdmin().catch((error) => {
  console.error('Error seeding admin:', error);
  process.exit(1);
});
