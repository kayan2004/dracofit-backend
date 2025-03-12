import { PartialType } from '@nestjs/mapped-types';
import { CreateExerciseLogDto } from './create-exercise-log.dto';

export class UpdateExerciseLogDto extends PartialType(CreateExerciseLogDto) {}
