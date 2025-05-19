import { Module, Logger, forwardRef } from '@nestjs/common'; // Ensure forwardRef is imported
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { UsersModule } from '../users/users.module';
import { WorkoutLogsModule } from '../workout-logs/workout-logs.module';
import { TemporarySchedule } from '../user-schedule/entities/temporary-schedule.entity';
import { UserScheduleEntry } from '../user-schedule/entities/user-schedule-entry.entity';
import { UserPetsModule } from '../user-pets/user-pets.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([TemporarySchedule, UserScheduleEntry]),
    forwardRef(() => UsersModule),
    forwardRef(() => WorkoutLogsModule),
    forwardRef(() => UserPetsModule), // <--- Use forwardRef here
  ],
  providers: [TasksService, Logger],
  exports: [TasksService],
})
export class TasksModule {}
