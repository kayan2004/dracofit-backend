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
  Query,
} from '@nestjs/common';
import { WorkoutLogsService } from './workout-logs.service';
import { CreateWorkoutLogDto } from './dto/create-workout-log.dto';
import { UpdateWorkoutLogDto } from './dto/update-workout-log.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkoutStatus } from './entities/workout-log.entity';

@Controller('workout-logs')
@UseGuards(JwtAuthGuard)
export class WorkoutLogsController {
  constructor(private readonly workoutLogsService: WorkoutLogsService) {}

  @Post('complete')
  completeWorkout(
    @Body() createWorkoutLogDto: CreateWorkoutLogDto,
    @Request() req,
  ) {
    return this.workoutLogsService.logWorkoutCompletion(
      req.user.id,
      createWorkoutLogDto,
    );
  }

  @Get()
  findAll(@Request() req, @Query('status') status?: WorkoutStatus) {
    return this.workoutLogsService.findAll(req.user.id, status);
  }

  @Get('stats')
  getStats(@Request() req) {
    return this.workoutLogsService.getStats(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.workoutLogsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateWorkoutLogDto: UpdateWorkoutLogDto,
    @Request() req,
  ) {
    return this.workoutLogsService.update(id, req.user.id, updateWorkoutLogDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.workoutLogsService.remove(id, req.user.id);
  }
}
