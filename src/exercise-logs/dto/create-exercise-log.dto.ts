import { IsInt, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class SetDataDto {
  @IsInt()
  setNumber: number;

  @IsInt()
  reps: number;

  @IsInt()
  weight?: number;
}

export class CreateExerciseLogDto {
  @IsInt()
  exerciseId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => SetDataDto)
  setsData: SetDataDto[];
}
