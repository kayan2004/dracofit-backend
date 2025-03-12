import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ExerciseLogsController,
  PersonalRecordsController,
} from './exercise-logs.controller';
import { ExerciseLogsService } from './exercise-logs.service';
import { ExerciseLog } from './entities/exercise-log.entity';
import { WorkoutLogsModule } from '../workout-logs/workout-logs.module';
import { ExercisesModule } from '../exercises/exercises.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExerciseLog]),
    WorkoutLogsModule,
    ExercisesModule,
  ],
  controllers: [ExerciseLogsController, PersonalRecordsController],
  providers: [ExerciseLogsService],
  exports: [ExerciseLogsService],
})
export class ExerciseLogsModule {}
