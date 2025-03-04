import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { Gender } from '../src/users/entities/user.entity';
import * as bcrypt from 'bcrypt';

async function seedAdmin() {
  // Create an application context for dependency injection
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const userRepository = dataSource.getRepository(User);

  // Check if an admin user already exists
  const adminUser = await userRepository.findOne({ where: { is_admin: true } });
  if (!adminUser) {
    // Get the admin password from environment variables
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      console.error(
        'ERROR: ADMIN_PASSWORD environment variable is not defined.',
      );
      process.exit(1);
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    const admin = userRepository.create({
      username: 'admin',
      fullname: 'Administrator',
      email: 'admin@example.com',
      password: hashedPassword,
      dob: new Date('1990-01-01'),
      gender: Gender.MALE,
      created_at: new Date(),
      is_admin: true,
      isEmailVerified: true,
    });

    await userRepository.save(admin);
    console.log('Admin user created successfully.');
  } else {
    console.log('Admin user already exists.');
  }
  await app.close();
}

seedAdmin().catch((err) => {
  console.error('Error seeding admin user:', err);
});
