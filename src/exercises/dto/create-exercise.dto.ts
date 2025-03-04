import { IsString, IsEnum, IsNotEmpty, IsArray } from 'class-validator';
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

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  targetMuscles?: string[];

  @IsString()
  videoUrl: string;
}
