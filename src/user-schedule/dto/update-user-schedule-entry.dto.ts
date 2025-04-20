import {
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  IsDate,
  Allow,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { WeekDay } from '../entities/user-schedule-entry.entity';

export class UpdateScheduleEntryDto {
  @IsOptional()
  @Transform(({ value }) => {
    // Handle null explicitly
    if (value === null || value === '') {
      return null;
    }
    // Convert to number if it's a valid number
    return isNaN(Number(value)) ? value : Number(value);
  })
  workoutPlanId?: number | null;

  @IsOptional()
  @IsString()
  preferredTime?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
