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
  BadRequestException,
} from '@nestjs/common';
import { UserScheduleService } from './user-schedule.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateScheduleDto } from './dto/update-user-schedule.dto';
import { UpdateScheduleEntryDto } from './dto/update-user-schedule-entry.dto';
import { WeekDay } from './entities/user-schedule-entry.entity';

@Controller('user-schedule')
@UseGuards(JwtAuthGuard)
export class UserScheduleController {
  private readonly logger = new Logger(UserScheduleController.name);

  constructor(private readonly userScheduleService: UserScheduleService) {}

  @Get()
  async getSchedule(@Request() req) {
    this.logger.log(`Getting schedule for user ${req.user.id}`);
    return this.userScheduleService.getOrCreateSchedule(req.user.id);
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
}
