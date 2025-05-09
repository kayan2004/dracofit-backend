import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserScheduleService } from './user-schedule.service';
import { UserScheduleController } from './user-schedule.controller';
import { UserSchedule } from './entities/user-schedule.entity';
import { UserScheduleEntry } from './entities/user-schedule-entry.entity';
import { WorkoutPlansModule } from '../workout_plans/workout_plans.module';
import { TemporarySchedule } from './entities/temporary-schedule.entity';
import { TasksModule } from '../tasks/tasks.module'; // Import TasksModule

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserSchedule,
      UserScheduleEntry,
      TemporarySchedule,
    ]),
    WorkoutPlansModule,
    TasksModule, // Add TasksModule here
  ],
  controllers: [UserScheduleController],
  providers: [UserScheduleService],
  exports: [UserScheduleService],
})
export class UserScheduleModule {}
