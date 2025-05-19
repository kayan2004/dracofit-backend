import { Module, forwardRef } from '@nestjs/common'; // Import forwardRef
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkoutLogsService } from './workout-logs.service';
import { WorkoutLogsController } from './workout-logs.controller';
import { WorkoutLog } from './entities/workout-log.entity';
import { WorkoutPlansModule } from '../workout_plans/workout_plans.module';
import { UsersModule } from '../users/users.module';
import { FriendshipsModule } from '../friendships/friendships.module';
import { UserPetsModule } from '../user-pets/user-pets.module';
import { StreaksModule } from '../streaks/streaks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkoutLog]),
    WorkoutPlansModule, // Assuming WorkoutPlansModule is okay or handled
    forwardRef(() => UsersModule), // <--- Use forwardRef here
    forwardRef(() => UserPetsModule),
    forwardRef(() => StreaksModule),
    FriendshipsModule, // Assuming FriendshipsModule is okay or handled
  ],
  controllers: [WorkoutLogsController],
  providers: [WorkoutLogsService],
  exports: [WorkoutLogsService],
})
export class WorkoutLogsModule {}
