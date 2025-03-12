import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkoutLogsService } from './workout-logs.service';
import { WorkoutLogsController } from './workout-logs.controller';
import { WorkoutLog } from './entities/workout-log.entity';
import { WorkoutPlansModule } from '../workout_plans/workout_plans.module';

@Module({
  imports: [TypeOrmModule.forFeature([WorkoutLog]), WorkoutPlansModule],
  controllers: [WorkoutLogsController],
  providers: [WorkoutLogsService],
  exports: [WorkoutLogsService],
})
export class WorkoutLogsModule {}
