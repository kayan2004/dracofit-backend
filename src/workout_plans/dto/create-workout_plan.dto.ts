import {
  IsString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  Min,
  MaxLength,
} from 'class-validator';
import { WorkoutPlanType } from '../entities/workout_plan.entity';

export class CreateWorkoutPlanDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @MaxLength(1000)
  description: string;

  @IsEnum(WorkoutPlanType)
  type: WorkoutPlanType;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  durationMinutes: number;
}
