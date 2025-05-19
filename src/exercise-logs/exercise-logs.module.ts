import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExerciseLog } from './entities/exercise-log.entity';
import { ExerciseLogsService } from './exercise-logs.service';
import { ExerciseLogsController } from './exercise-logs.controller';
import { WorkoutLogsModule } from '../workout-logs/workout-logs.module'; // Ensure this is correctly imported
import { ExercisesModule } from '../exercises/exercises.module'; // Ensure this is correctly imported
import { ExerciseAnalyticsController } from './exercise-analytics.controller'; // Import the new controller

@Module({
  imports: [
    TypeOrmModule.forFeature([ExerciseLog]),
    forwardRef(() => WorkoutLogsModule), // Use forwardRef if there's a circular dependency
    ExercisesModule, // Make sure ExercisesModule exports ExercisesService
  ],
  controllers: [
    ExerciseLogsController,
    ExerciseAnalyticsController, // Add the new controller here
  ],
  providers: [ExerciseLogsService],
  exports: [ExerciseLogsService],
})
export class ExerciseLogsModule {}
