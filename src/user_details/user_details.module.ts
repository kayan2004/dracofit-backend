import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express'; // Import MulterModule
import { diskStorage } from 'multer'; // Import diskStorage
import * as path from 'path'; // Import path
import * as fs from 'fs'; // Import fs
import { UserDetailsService } from './user_details.service';
import { UserDetailsController } from './user_details.controller';
import { UserDetail } from './entities/user_detail.entity';
import { User } from '../users/entities/user.entity'; // Ensure User is imported
import { UsersModule } from '../users/users.module'; // Import UsersModule if needed by service

// Define the upload directory path
const uploadPath = path.resolve(
  __dirname,
  '..',
  '..',
  'uploads',
  'profile-pics',
);

// Ensure the upload directory exists
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
  console.log(`Created upload directory: ${uploadPath}`);
} else {
  console.log(`Upload directory already exists: ${uploadPath}`);
}

@Module({
  imports: [
    TypeOrmModule.forFeature([UserDetail, User]),
    UsersModule, // Include if UserDetailsService depends on UsersService
    MulterModule.register({
      // Register MulterModule
      storage: diskStorage({
        destination: uploadPath, // Use the defined path
        // Add type annotation for req parameter if needed, or assert req.user type
        filename: (req: any, file, cb) => {
          // You can use 'any' for req here for simplicity
          // --- TYPE ASSERTION ---
          // Assert that req.user is of type User (or at least has an id property)
          const user = req.user as User; // Tell TypeScript what req.user is
          const userId = user?.id || 'unknown'; // Now access user.id
          // --- END TYPE ASSERTION ---

          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const extension = path.extname(file.originalname);
          cb(null, `user-${userId}-${uniqueSuffix}${extension}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        // Basic image file filter
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
          return cb(
            new Error('Only image files (jpg, jpeg, png, gif) are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 1024 * 1024 * 5, // 5MB file size limit
      },
    }),
  ],
  controllers: [UserDetailsController],
  providers: [UserDetailsService],
  exports: [UserDetailsService], // Export if needed by other modules
})
export class UserDetailsModule {}
