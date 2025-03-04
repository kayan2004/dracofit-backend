import { PartialType } from '@nestjs/mapped-types';
import { CreateWorkoutPlanDto } from './create-workout_plan.dto';

export class UpdateWorkoutPlanDto extends PartialType(CreateWorkoutPlanDto) {}
