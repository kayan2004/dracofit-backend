import { PartialType } from '@nestjs/mapped-types';
import { CreateWorkoutLogDto } from './create-workout-log.dto';

export class UpdateWorkoutLogDto extends PartialType(CreateWorkoutLogDto) {}
