import { IsString, IsBoolean, IsOptional, MaxLength } from 'class-validator';

export class UpdateScheduleDto {
  @IsString()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
