import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkoutExercise } from './entities/workout_exercise.entity';
import { WorkoutExercisesService } from './workout_exercises.service';
import { WorkoutExercisesController } from './workout_exercises.controller';
import { WorkoutPlansModule } from '../workout_plans/workout_plans.module';
import { ExercisesModule } from '../exercises/exercises.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkoutExercise]),
    WorkoutPlansModule,
    ExercisesModule,
  ],
  controllers: [WorkoutExercisesController],
  providers: [WorkoutExercisesService],
  exports: [WorkoutExercisesService, TypeOrmModule],
})
export class WorkoutExercisesModule {}
