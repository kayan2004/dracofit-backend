import { PartialType } from '@nestjs/mapped-types';
import { CreateWorkoutLogDto } from './create-workout-log.dto';
import { IsDate, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer'; // Import Type

export class UpdateWorkoutLogDto extends PartialType(CreateWorkoutLogDto) {
  @IsOptional()
  @Type(() => Date) // Add this line to transform incoming string/number to Date
  @IsDate()
  startTime?: Date;

  @IsOptional()
  @Type(() => Date) // Add this line to transform incoming string/number to Date
  @IsDate()
  endTime?: Date;

  // Add xpEarned if you re-enable it later
  // @IsOptional()
  // @IsNumber()
  // xpEarned?: number;
}
