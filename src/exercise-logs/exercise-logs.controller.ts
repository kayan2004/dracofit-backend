import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { ExerciseLogsService } from './exercise-logs.service';
import { CreateExerciseLogDto } from './dto/create-exercise-log.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('workout-logs/:workoutLogId/exercises')
@UseGuards(JwtAuthGuard)
export class ExerciseLogsController {
  constructor(private readonly exerciseLogsService: ExerciseLogsService) {}

  @Post()
  create(
    @Param('workoutLogId', ParseIntPipe) workoutLogId: number,
    @Request() req,
    @Body() createExerciseLogDto: CreateExerciseLogDto,
  ) {
    return this.exerciseLogsService.create(
      workoutLogId,
      req.user.id,
      createExerciseLogDto,
    );
  }

  @Get()
  findAll(
    @Param('workoutLogId', ParseIntPipe) workoutLogId: number,
    @Request() req,
  ) {
    return this.exerciseLogsService.findAll(workoutLogId, req.user.id);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Param('workoutLogId', ParseIntPipe) workoutLogId: number,
    @Request() req,
  ) {
    return this.exerciseLogsService.findOne(id, workoutLogId, req.user.id);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Param('workoutLogId', ParseIntPipe) workoutLogId: number,
    @Request() req,
  ) {
    return this.exerciseLogsService.remove(id, workoutLogId, req.user.id);
  }
}

@Controller('personal-records')
@UseGuards(JwtAuthGuard)
export class PersonalRecordsController {
  constructor(private readonly exerciseLogsService: ExerciseLogsService) {}

  @Get()
  getPersonalRecords(@Request() req) {
    return this.exerciseLogsService.getPersonalRecords(req.user.id);
  }
}
