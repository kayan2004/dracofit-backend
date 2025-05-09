import { Module, Logger } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { UsersModule } from '../users/users.module';
import { WorkoutLogsModule } from '../workout-logs/workout-logs.module';
import { TemporarySchedule } from '../user-schedule/entities/temporary-schedule.entity';
import { UserScheduleEntry } from '../user-schedule/entities/user-schedule-entry.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([TemporarySchedule, UserScheduleEntry]),
    UsersModule,
    WorkoutLogsModule,
  ],
  providers: [TasksService, Logger],
  exports: [TasksService], // <-- Add this line to export TasksService
})
export class TasksModule {}
