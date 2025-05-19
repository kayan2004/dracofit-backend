import { IsDate, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class GetWorkoutLogsByDateDto {
  @IsNotEmpty({ message: 'startDate should not be empty' })
  @Type(() => Date) // Transforms the incoming string to a Date object
  @IsDate({ message: 'startDate must be a valid Date instance' })
  startDate: Date;

  @IsNotEmpty({ message: 'endDate should not be empty' })
  @Type(() => Date) // Transforms the incoming string to a Date object
  @IsDate({ message: 'endDate must be a valid Date instance' })
  endDate: Date;
}
