import { PartialType } from '@nestjs/mapped-types';
import { CreateWorkoutExerciseDto } from './create-workout_exercise.dto';

export class UpdateWorkoutExerciseDto extends PartialType(CreateWorkoutExerciseDto) {}
