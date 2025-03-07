import {
  IsEnum,
  IsISO8601,
  IsNumber,
  IsInt,
  IsArray,
  IsDate,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  Gender,
  FitnessLevel,
  FitnessGoal,
} from '../entities/user_detail.entity';

export class CreateUserDetailDto {
  @IsEnum(Gender)
  gender: Gender;

  @IsDate()
  @Type(() => Date)
  birthdate: Date;

  @IsNumber()
  @Min(30)
  @Max(300)
  weight: number;

  @IsNumber()
  @Min(100)
  @Max(250)
  height: number;

  @IsEnum(FitnessLevel)
  fitness_level: FitnessLevel;

  @IsEnum(FitnessGoal)
  fitness_goal: FitnessGoal;

  @IsInt()
  @Min(1)
  @Max(7)
  workout_days_per_week: number;

  @IsArray()
  preferred_workout_types: string[];
}
