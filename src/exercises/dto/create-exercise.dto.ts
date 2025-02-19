import { IsString, IsEnum } from 'class-validator';
import { Difficulty } from '../entities/exercise.entity';

export class CreateExerciseDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  type: string;

  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @IsString()
  equipment: string;

  @IsString()
  musclegroup: string;

  @IsString()
  gif: string;
}
