import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPetsService } from './user-pets.service';
import { UserPetsController } from './user-pets.controller';
import { Pet } from './entities/user-pet.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pet]),
    UsersModule, // Import to get access to User repository
  ],
  controllers: [UserPetsController],
  providers: [UserPetsService],
  exports: [UserPetsService],
})
export class UserPetsModule {}
