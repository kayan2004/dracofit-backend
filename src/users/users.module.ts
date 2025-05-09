import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserTokens } from '../user-tokens/entities/user-token.entity';
import { UserPetsModule } from '../user-pets/user-pets.module'; // Import UserPetsModule

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserTokens]),
    forwardRef(() => UserPetsModule),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
