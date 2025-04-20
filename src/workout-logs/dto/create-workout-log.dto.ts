import { IsNumber, IsOptional } from 'class-validator';

export class CreateWorkoutLogDto {
  @IsNumber()
  workoutPlanId: number;

  @IsOptional() // Make duration optional for creation
  @IsNumber()
  durationMinutes?: number; // It won't be used directly for storage anyway
}
