import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { WorkoutLogsService } from './workout-logs.service';
import { CreateWorkoutLogDto } from './dto/create-workout-log.dto';
import { UpdateWorkoutLogDto } from './dto/update-workout-log.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('workout-logs')
@UseGuards(JwtAuthGuard)
export class WorkoutLogsController {
  constructor(private readonly workoutLogsService: WorkoutLogsService) {}

  @Post()
  logCompletedWorkout(
    @Body() createWorkoutLogDto: CreateWorkoutLogDto,
    @Request() req,
  ) {
    return this.workoutLogsService.logCompletedWorkout(
      req.user.id,
      createWorkoutLogDto,
    );
  }

  @Get()
  findAll(@Request() req) {
    return this.workoutLogsService.findAll(req.user.id);
  }

  @Get('stats')
  getStats(@Request() req) {
    return this.workoutLogsService.getStats(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.workoutLogsService.findOne(+id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateWorkoutLogDto: UpdateWorkoutLogDto,
    @Request() req,
  ) {
    return this.workoutLogsService.update(
      +id,
      req.user.id,
      updateWorkoutLogDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.workoutLogsService.remove(+id, req.user.id);
  }
}
