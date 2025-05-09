import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPetsService } from './user-pets.service';
import { UserPetsController } from './user-pets.controller';
import { Pet } from './entities/user-pet.entity';
import { User } from '../users/entities/user.entity';
import { UserCreatedPetListener } from './listeners/user-created.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pet, User]),
    // forwardRef(() => UsersModule),
  ],
  controllers: [UserPetsController],
  providers: [UserPetsService, UserCreatedPetListener],
  exports: [UserPetsService],
})
export class UserPetsModule {}
