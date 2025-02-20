import { IsString, IsEnum, IsNotEmpty } from 'class-validator';
import { Difficulty } from '../entities/exercise.entity';

export class CreateExerciseDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  description: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsEnum(Difficulty)
  @IsNotEmpty()
  difficulty: Difficulty;

  @IsString()
  equipment: string;

  @IsString()
  @IsNotEmpty()
  musclegroup: string;

  @IsString()
  gif: string;
}
