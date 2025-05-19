import { Module, forwardRef } from '@nestjs/common'; // Import forwardRef
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkoutPlansService } from './workout_plans.service';
import { WorkoutPlansController } from './workout_plans.controller';
import { WorkoutPlan } from './entities/workout_plan.entity';
import { WorkoutExercise } from '../workout_exercises/entities/workout_exercise.entity';
import { UsersModule } from '../users/users.module';
import { ExercisesModule } from '../exercises/exercises.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkoutPlan, WorkoutExercise]),
    forwardRef(() => UsersModule), // Use forwardRef here for UsersModule
    ExercisesModule,
  ],
  controllers: [WorkoutPlansController],
  providers: [WorkoutPlansService],
  exports: [WorkoutPlansService],
})
export class WorkoutPlansModule {}
