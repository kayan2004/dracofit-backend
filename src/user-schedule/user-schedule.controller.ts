import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Logger,
  Req,
  BadRequestException,
  Post, // Import Post decorator
} from '@nestjs/common';
import { UserScheduleService } from './user-schedule.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateScheduleDto } from './dto/update-user-schedule.dto';
import { UpdateScheduleEntryDto } from './dto/update-user-schedule-entry.dto';
import { WeekDay } from './entities/user-schedule-entry.entity';
import { TasksService } from '../tasks/tasks.service'; // Import TasksService

@Controller('user-schedule')
@UseGuards(JwtAuthGuard)
export class UserScheduleController {
  private readonly logger = new Logger(UserScheduleController.name);

  constructor(
    private readonly userScheduleService: UserScheduleService,
    private readonly tasksService: TasksService, // Inject TasksService here
  ) {}

  @Get()
  async getWeeklyView(@Req() req) {
    const userId = req.user.id; // Or however you get userId
    return this.userScheduleService.getWeeklyScheduleView(userId); // <<< MUST CALL THIS
  }

  @Put()
  async updateSchedule(
    @Request() req,
    @Body() updateScheduleDto: UpdateScheduleDto,
  ) {
    this.logger.log(`Updating schedule for user ${req.user.id}`);
    return this.userScheduleService.updateSchedule(
      req.user.id,
      updateScheduleDto,
    );
  }

  @Put('day/:day')
  async updateDay(
    @Request() req,
    @Param('day') day: string,
    @Body() updateDto: UpdateScheduleEntryDto,
  ) {
    this.logger.log(`Request to update day ${day} for user ${req.user.id}`);
    this.logger.debug('Update data:', updateDto);

    try {
      // Validate the day parameter
      if (!Object.values(WeekDay).includes(day as WeekDay)) {
        throw new BadRequestException(`Invalid day: ${day}`);
      }

      return await this.userScheduleService.updateScheduleEntry(
        req.user.id,
        day as WeekDay,
        updateDto,
      );
    } catch (error) {
      this.logger.error(
        `Error updating day ${day}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Delete('day/:day')
  async clearDay(@Request() req, @Param('day') day: string) {
    this.logger.log(`Clearing day ${day} for user ${req.user.id}`);

    // Validate the day parameter
    if (!Object.values(WeekDay).includes(day as WeekDay)) {
      throw new BadRequestException(`Invalid day: ${day}`);
    }

    return this.userScheduleService.setDayToRest(req.user.id, day as WeekDay);
  }

  @Delete()
  async resetSchedule(@Request() req) {
    this.logger.log(`Resetting schedule for user ${req.user.id}`);
    return this.userScheduleService.resetSchedule(req.user.id);
  }

  // --- TEMPORARY TESTING ENDPOINTS ---
  // Add these methods inside the UserScheduleController class

  @Post('tasks/trigger-skip-check') // Use POST
  async triggerSkipCheck(@Request() req) {
    this.logger.warn(
      `Manually triggering skip check task for user ${req.user.id}`,
    );
    // Don't await if you just want to trigger it and let it run in the background
    this.tasksService.handleCronCheckSkippedWorkouts();
    return { message: 'Skip check task triggered.' };
  }

  @Post('tasks/trigger-cleanup') // Use POST
  async triggerCleanup(@Request() req) {
    this.logger.warn(
      `Manually triggering cleanup task for user ${req.user.id}`,
    );
    // Don't await if you just want to trigger it and let it run in the background
    this.tasksService.handleCronCleanupOldReschedules();
    return { message: 'Cleanup task triggered.' };
  }
  // --- END TEMPORARY TESTING ENDPOINTS ---
}
