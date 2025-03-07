import { IsInt, IsPositive, Min } from 'class-validator';

export class CreateWorkoutExerciseDto {
  @IsInt()
  @IsPositive()
  exerciseId: number;

  @IsInt()
  @IsPositive()
  sets: number;

  @IsInt()
  @IsPositive()
  reps: number;

  @IsInt()
  @IsPositive()
  orderIndex: number;

  @IsInt()
  @Min(0)
  restTimeSeconds: number;
}
