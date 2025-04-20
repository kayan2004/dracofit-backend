import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UserSchedule } from './entities/user-schedule.entity';
import {
  UserScheduleEntry,
  WeekDay,
} from './entities/user-schedule-entry.entity';
import { UpdateScheduleDto } from './dto/update-user-schedule.dto';
import { UpdateScheduleEntryDto } from './dto/update-user-schedule-entry.dto';

@Injectable()
export class UserScheduleService {
  private readonly logger = new Logger(UserScheduleService.name);

  constructor(
    @InjectRepository(UserSchedule)
    private userScheduleRepository: Repository<UserSchedule>,

    @InjectRepository(UserScheduleEntry)
    private scheduleEntryRepository: Repository<UserScheduleEntry>,
  ) {}

  /**
   * Get or create a user's schedule
   */
  async getOrCreateSchedule(userId: number): Promise<UserSchedule> {
    this.logger.log(`Getting or creating schedule for user ${userId}`);

    // Try to find an existing schedule
    let schedule = await this.userScheduleRepository.findOne({
      where: { userId },
      relations: ['entries', 'entries.workoutPlan'],
    });

    // If no schedule exists, create a new one
    if (!schedule) {
      this.logger.log(
        `No schedule found for user ${userId}, creating new schedule`,
      );

      // Create a new schedule
      const newSchedule = this.userScheduleRepository.create({
        userId,
        name: 'My Weekly Schedule',
        isActive: true,
      });

      try {
        // Save the schedule
        schedule = await this.userScheduleRepository.save(newSchedule);
        this.logger.log(`Created new schedule with ID ${schedule.id}`);

        // Create empty entries for each day of the week
        for (const day of Object.values(WeekDay)) {
          const entry = this.scheduleEntryRepository.create({
            scheduleId: schedule.id,
            dayOfWeek: day,
            workoutPlanId: null,
            preferredTime: null,
            notes: null,
          });

          await this.scheduleEntryRepository.save(entry);
          this.logger.log(`Created entry for ${day}`);
        }

        // Reload with relations
        const reloadedSchedule = await this.userScheduleRepository.findOne({
          where: { userId },
          relations: ['entries', 'entries.workoutPlan'],
        });

        if (!reloadedSchedule) {
          throw new InternalServerErrorException(
            'Failed to reload schedule after creation',
          );
        }

        return reloadedSchedule;
      } catch (error) {
        this.logger.error(
          `Error creating schedule: ${error.message}`,
          error.stack,
        );
        throw new InternalServerErrorException('Failed to create schedule');
      }
    }

    return schedule;
  }

  /**
   * Update a user's schedule
   */
  async updateSchedule(
    userId: number,
    updateScheduleDto: UpdateScheduleDto,
  ): Promise<UserSchedule> {
    const schedule = await this.getOrCreateSchedule(userId);

    // Update the schedule properties
    if (updateScheduleDto.name !== undefined) {
      schedule.name = updateScheduleDto.name;
    }

    if (updateScheduleDto.isActive !== undefined) {
      schedule.isActive = updateScheduleDto.isActive;
    }

    // Save the updated schedule
    await this.userScheduleRepository.save(schedule);

    // Return the updated schedule with relations
    return this.getOrCreateSchedule(userId);
  }

  /**
   * Update a schedule entry for a specific day
   */
  async updateScheduleEntry(
    userId: number,
    day: WeekDay,
    updateEntryDto: UpdateScheduleEntryDto,
  ): Promise<UserScheduleEntry> {
    this.logger.log(`Updating schedule entry for user ${userId}, day ${day}`);
    this.logger.debug(`Update data:`, updateEntryDto);

    // Validate the day
    if (!Object.values(WeekDay).includes(day)) {
      throw new BadRequestException(`Invalid day: ${day}`);
    }

    // Get the user's schedule
    const schedule = await this.getOrCreateSchedule(userId);

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    // Find the entry for the specific day
    const entry = schedule.entries?.find((e) => e.dayOfWeek === day);

    if (!entry) {
      throw new NotFoundException(`Schedule entry for ${day} not found`);
    }

    this.logger.log(`Found entry ID ${entry.id} for day ${day}`);

    try {
      // Update the entry fields directly with TypeORM update method
      // This avoids issues with null values
      const updateResult = await this.scheduleEntryRepository.update(
        { id: entry.id },
        {
          workoutPlanId: updateEntryDto.workoutPlanId,
          preferredTime: updateEntryDto.preferredTime,
          notes: updateEntryDto.notes,
        },
      );

      this.logger.log(`Update result: ${JSON.stringify(updateResult)}`);

      // Fetch the updated entry with relations
      const updatedEntry = await this.scheduleEntryRepository.findOne({
        where: { id: entry.id },
        relations: ['workoutPlan'],
      });

      if (!updatedEntry) {
        throw new NotFoundException('Failed to find updated entry');
      }

      return updatedEntry;
    } catch (error) {
      this.logger.error(`Error updating entry: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        `Failed to update schedule entry: ${error.message}`,
      );
    }
  }

  /**
   * Set a day to rest (clear workout assignment)
   */
  async setDayToRest(userId: number, day: WeekDay): Promise<UserScheduleEntry> {
    this.logger.log(`Setting ${day} to rest day for user ${userId}`);

    try {
      return await this.updateScheduleEntry(userId, day, {
        workoutPlanId: null,
        preferredTime: null,
        notes: null,
      });
    } catch (error) {
      this.logger.error(
        `Error setting day to rest: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Reset the entire schedule (set all days to rest)
   */
  async resetSchedule(userId: number): Promise<UserSchedule> {
    this.logger.log(`Resetting schedule for user ${userId}`);

    try {
      const schedule = await this.getOrCreateSchedule(userId);

      // Update all entries to be rest days using direct SQL for efficiency
      if (schedule.entries?.length > 0) {
        const entryIds = schedule.entries.map((entry) => entry.id);

        await this.scheduleEntryRepository.update(
          { id: In(entryIds) },
          {
            workoutPlanId: null,
            preferredTime: null,
            notes: null,
          },
        );
      }

      // Return the updated schedule
      return this.getOrCreateSchedule(userId);
    } catch (error) {
      this.logger.error(
        `Error resetting schedule: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to reset schedule: ${error.message}`,
      );
    }
  }
}
