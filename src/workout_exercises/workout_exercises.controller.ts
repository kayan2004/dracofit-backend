import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
  ParseArrayPipe,
} from '@nestjs/common';
import { WorkoutExercisesService } from './workout_exercises.service';
import { CreateWorkoutExerciseDto } from './dto/create-workout_exercise.dto';
import { UpdateWorkoutExerciseDto } from './dto/update-workout_exercise.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('workout-plans/:workoutPlanId/exercises')
@UseGuards(JwtAuthGuard)
export class WorkoutExercisesController {
  constructor(
    private readonly workoutExercisesService: WorkoutExercisesService,
  ) {}

  @Post()
  create(
    @Param('workoutPlanId', ParseIntPipe) workoutPlanId: number,
    @Request() req,
    @Body() createWorkoutExerciseDto: CreateWorkoutExerciseDto,
  ) {
    return this.workoutExercisesService.create(
      workoutPlanId,
      req.user.id,
      createWorkoutExerciseDto,
    );
  }

  @Get()
  findAll(
    @Param('workoutPlanId', ParseIntPipe) workoutPlanId: number,
    @Request() req,
  ) {
    return this.workoutExercisesService.findAll(workoutPlanId, req.user.id);
  }

  @Get(':exerciseId')
  findOne(
    @Param('workoutPlanId', ParseIntPipe) workoutPlanId: number,
    @Param('exerciseId', ParseIntPipe) exerciseId: number,
    @Request() req,
  ) {
    return this.workoutExercisesService.findOne(
      workoutPlanId,
      exerciseId,
      req.user.id,
    );
  }

  @Patch(':exerciseId')
  update(
    @Param('workoutPlanId', ParseIntPipe) workoutPlanId: number,
    @Param('exerciseId', ParseIntPipe) exerciseId: number,
    @Request() req,
    @Body() updateWorkoutExerciseDto: UpdateWorkoutExerciseDto,
  ) {
    return this.workoutExercisesService.update(
      workoutPlanId,
      exerciseId,
      req.user.id,
      updateWorkoutExerciseDto,
    );
  }

  @Delete(':exerciseId')
  remove(
    @Param('workoutPlanId', ParseIntPipe) workoutPlanId: number,
    @Param('exerciseId', ParseIntPipe) exerciseId: number,
    @Request() req,
  ) {
    return this.workoutExercisesService.remove(
      workoutPlanId,
      exerciseId,
      req.user.id,
    );
  }

  @Post('reorder')
  reorderExercises(
    @Param('workoutPlanId', ParseIntPipe) workoutPlanId: number,
    @Request() req,
    @Body('exerciseIds', new ParseArrayPipe({ items: Number }))
    exerciseIds: number[],
  ) {
    return this.workoutExercisesService.reorderExercises(
      workoutPlanId,
      req.user.id,
      exerciseIds,
    );
  }
}
