import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserDetailsService } from './user_details.service';
import { UserDetailsController } from './user_details.controller';
import { UserDetail } from './entities/user_detail.entity';
import { UsersModule } from '../users/users.module';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserDetail, User]), UsersModule],
  controllers: [UserDetailsController],
  providers: [UserDetailsService],
  exports: [UserDetailsService],
})
export class UserDetailsModule {}
