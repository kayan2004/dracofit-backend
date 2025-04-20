import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { WeekDay } from '../entities/user-schedule-entry.entity';

export class CreateScheduleEntryDto {
  @IsEnum(WeekDay)
  dayOfWeek: WeekDay;

  @IsNumber()
  @ValidateIf((o) => o.workoutPlanId !== null)
  @IsOptional()
  workoutPlanId?: number | null;

  @IsString()
  @IsOptional()
  preferredTime?: string | null;

  @IsString()
  @IsOptional()
  notes?: string | null;
}
