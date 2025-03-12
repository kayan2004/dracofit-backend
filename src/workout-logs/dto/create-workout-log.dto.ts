import { IsEnum, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { WorkoutStatus } from '../entities/workout-log.entity';

export class CreateWorkoutLogDto {
  @IsNumber()
  @IsNotEmpty()
  workoutPlanId: number; // Required - which workout was done

  // No need for startTime/endTime - calculated automatically

  @IsEnum(WorkoutStatus)
  @IsOptional()
  status?: WorkoutStatus = WorkoutStatus.COMPLETED; // Default to completed

  // Duration in minutes - more user friendly than timestamps
  @IsNumber()
  @IsOptional()
  durationMinutes?: number;
}
