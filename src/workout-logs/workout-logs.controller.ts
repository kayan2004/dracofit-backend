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
  Query, // Import Query decorator
  ParseIntPipe, // For optional query param parsing
  ValidationPipe, // For query validation
  ParseDatePipe, // For date parsing
  DefaultValuePipe, // For optional query params'
  Req,
} from '@nestjs/common';
import { WorkoutLogsService } from './workout-logs.service';
import { CreateWorkoutLogDto } from './dto/create-workout-log.dto';
import { UpdateWorkoutLogDto } from './dto/update-workout-log.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional } from 'class-validator';
import { GetWorkoutLogsByDateDto } from './dto/get-workout-logs-by-date.dto';

@Controller('workout-logs')
@UseGuards(JwtAuthGuard)
export class WorkoutLogsController {
  constructor(private readonly workoutLogsService: WorkoutLogsService) {}

  // POST /workout-logs (existing)
  @Post()
  create(@Body() createWorkoutLogDto: CreateWorkoutLogDto, @Request() req) {
    // Corrected order of arguments
    return this.workoutLogsService.create(createWorkoutLogDto, req.user.id);
  }

  // GET /workout-logs (existing)
  @Get()
  findAll(@Request() req) {
    return this.workoutLogsService.findAll(req.user.id);
  }
  @Get('by-date')
  @UseGuards(JwtAuthGuard)
  async findByDateRange(
    @Query() queryParams: GetWorkoutLogsByDateDto, // DTO now only has startDate and endDate
    @Req() req,
  ) {
    const userId = req.user.id;
    return this.workoutLogsService.getLogsByDateRange(
      // Or whatever your service method is named
      userId,
      queryParams.startDate,
      queryParams.endDate,
      // workoutPlanId is no longer passed from here
    );
  }

  // --- NEW ENDPOINT ---
  // // GET /workout-logs/by-date?startDate=...&endDate=...&workoutPlanId=...
  // @Get('by-date')
  // findLogsByDate(
  //   @Request() req,
  //   // Use the DTO with ValidationPipe for query parameters
  //   @Query(new ValidationPipe({ transform: true, whitelist: true }))
  //   query: FindLogsByDateQueryDto,
  // ) {
  //   return this.workoutLogsService.findLogsByDateRange(
  //     req.user.id,
  //     query.startDate,
  //     query.endDate,
  //     query.workoutPlanId, // Pass optional workoutPlanId
  //   );
  // }
  // --- END NEW ENDPOINT ---

  // GET /workout-logs/stats (existing)
  // @Get('stats')
  // getStats(@Request() req) {
  //   return this.workoutLogsService.getStats(req.user.id);
  // }

  // GET /workout-logs/:id (existing)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.workoutLogsService.findOne(id, req.user.id);
  }

  // PATCH /workout-logs/:id (existing)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateWorkoutLogDto: UpdateWorkoutLogDto,
    @Request() req,
  ) {
    return this.workoutLogsService.update(id, req.user.id, updateWorkoutLogDto);
  }

  // DELETE /workout-logs/:id (existing)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.workoutLogsService.remove(id, req.user.id);
  }

  // This endpoint will handle GET requests with startDate and endDate in query parameters
}
