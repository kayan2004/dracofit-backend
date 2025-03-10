import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { WorkoutPlansService } from './workout_plans.service';
import { CreateWorkoutPlanDto } from './dto/create-workout_plan.dto';
import { UpdateWorkoutPlanDto } from './dto/update-workout_plan.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@UseGuards(JwtAuthGuard)
@Controller('workout-plans')
export class WorkoutPlansController {
  constructor(private readonly workoutPlansService: WorkoutPlansService) {}
  @UseGuards(AdminGuard)
  @Get('user/:userId')
  findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.workoutPlansService.findByUser(userId);
  }
  @Post()
  create(@Body() createWorkoutPlanDto: CreateWorkoutPlanDto, @Request() req) {
    return this.workoutPlansService.create(createWorkoutPlanDto, req.user);
  }

  @Get()
  findAll(@Request() req) {
    return this.workoutPlansService.findByUser(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.workoutPlansService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateWorkoutPlanDto: UpdateWorkoutPlanDto,
    @Request() req,
  ) {
    return this.workoutPlansService.update(
      id,
      updateWorkoutPlanDto,
      req.user.id,
    );
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.workoutPlansService.remove(id, req.user.id);
  }
}
