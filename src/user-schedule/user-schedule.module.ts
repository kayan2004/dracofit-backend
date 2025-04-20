import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserScheduleService } from './user-schedule.service';
import { UserScheduleController } from './user-schedule.controller';
import { UserSchedule } from './entities/user-schedule.entity';
import { UserScheduleEntry } from './entities/user-schedule-entry.entity';
import { WorkoutPlansModule } from '../workout_plans/workout_plans.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserSchedule, UserScheduleEntry]),
    WorkoutPlansModule,
  ],
  controllers: [UserScheduleController],
  providers: [UserScheduleService],
  exports: [UserScheduleService],
})
export class UserScheduleModule {}
