import { Module, forwardRef } from '@nestjs/common'; // Import forwardRef
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserScheduleService } from './user-schedule.service';
import { UserScheduleController } from './user-schedule.controller';
import { UserSchedule } from './entities/user-schedule.entity';
import { UserScheduleEntry } from './entities/user-schedule-entry.entity';
// import { TemporarySchedule } from './entities/temporary-schedule.entity'; // Commented out
import { WorkoutPlansModule } from '../workout_plans/workout_plans.module';
import { TasksModule } from '../tasks/tasks.module'; // Import TasksModule

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserSchedule,
      UserScheduleEntry,
      // TemporarySchedule, // Commented out
    ]),
    WorkoutPlansModule,
    forwardRef(() => TasksModule), // Use forwardRef here for TasksModule
  ],
  controllers: [UserScheduleController],
  providers: [UserScheduleService],
  exports: [UserScheduleService],
})
export class UserScheduleModule {}
