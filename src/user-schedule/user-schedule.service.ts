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
// Import the new entity
import { TemporarySchedule } from './entities/temporary-schedule.entity';
// Import WorkoutPlan if needed for relations, though it might come via relations
// import { WorkoutPlan } from '../../workout_plans/entities/workout_plan.entity';

@Injectable()
export class UserScheduleService {
  private readonly logger = new Logger(UserScheduleService.name);

  constructor(
    @InjectRepository(UserSchedule)
    private userScheduleRepository: Repository<UserSchedule>,
    @InjectRepository(UserScheduleEntry)
    private scheduleEntryRepository: Repository<UserScheduleEntry>,
    // Inject the TemporarySchedule repository
    @InjectRepository(TemporarySchedule)
    private tempScheduleRepository: Repository<TemporarySchedule>,
    // Inject WorkoutPlan repository only if you need to fetch plans separately
    // @InjectRepository(WorkoutPlan)
    // private workoutPlanRepository: Repository<WorkoutPlan>,
  ) {}

  // Helper function to get the start of the current week (assuming Sunday start)
  // Adjust if your week starts on Monday
  private getCurrentWeekStartDate(): Date {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 for Sunday, 1 for Monday, etc.
    const diff = today.getDate() - dayOfWeek; // Adjust to Sunday
    const weekStart = new Date(today.setDate(diff));
    weekStart.setHours(0, 0, 0, 0); // Set to midnight
    return weekStart;
  }

  /**
   * Get or create a user's schedule, applying temporary reschedules for the current week.
   */
  async getOrCreateSchedule(userId: number): Promise<UserSchedule> {
    this.logger.log(
      `Getting or creating schedule for user ${userId} (with reschedule check)`,
    );

    // 1. Fetch the base user schedule with entries and workout plans
    // Ensure relations are loaded as needed by the frontend
    let schedule = await this.userScheduleRepository.findOne({
      where: { userId },
      relations: ['entries', 'entries.workoutPlan'], // Eager loading might handle this too
    });

    // 2. If no schedule exists, create a new one with default entries
    if (!schedule) {
      this.logger.log(
        `No schedule found for user ${userId}, creating new schedule`,
      );
      // ... (existing schedule creation logic) ...
      try {
        const newSchedule = this.userScheduleRepository.create({ userId });
        schedule = await this.userScheduleRepository.save(newSchedule);
        this.logger.log(`Created new schedule with ID ${schedule.id}`);

        const entriesToCreate: Partial<UserScheduleEntry>[] = [];
        for (const day of Object.values(WeekDay)) {
          entriesToCreate.push({
            scheduleId: schedule.id,
            dayOfWeek: day,
            workoutPlanId: null,
            preferredTime: null,
            notes: null,
          });
        }
        await this.scheduleEntryRepository.save(entriesToCreate);
        this.logger.log(`Created default entries for schedule ${schedule.id}`);

        // Reload schedule with entries
        schedule = await this.userScheduleRepository.findOne({
          where: { id: schedule.id },
          relations: ['entries', 'entries.workoutPlan'],
        });
        if (!schedule) throw new Error('Failed to reload schedule'); // Should not happen
      } catch (error) {
        this.logger.error(
          `Error creating schedule or entries: ${error.message}`,
          error.stack,
        );
        throw new InternalServerErrorException('Failed to create schedule');
      }
    }

    // Ensure entries array exists (might be null if relations didn't load correctly)
    if (!schedule.entries) {
      schedule.entries = [];
    }

    // 3. Fetch active temporary reschedules for the current week
    const weekStartDate = this.getCurrentWeekStartDate();
    const activeReschedules = await this.tempScheduleRepository.find({
      where: {
        user: { id: userId },
        weekStartDate: weekStartDate,
      },
      relations: ['workoutPlan'], // Load the workout plan associated with the reschedule
      order: { createdAt: 'ASC' }, // Apply in order they were created if needed
    });

    // 4. Apply the reschedules if any exist
    if (activeReschedules.length > 0) {
      this.logger.log(
        `Applying ${
          activeReschedules.length
        } reschedules for user ${userId}, week starting ${
          weekStartDate.toISOString().split('T')[0]
        }`,
      );

      // Create a map for quick lookup of entries by dayOfWeek
      const entriesMap = new Map<WeekDay, UserScheduleEntry>();
      schedule.entries.forEach((entry) =>
        entriesMap.set(entry.dayOfWeek, entry),
      );

      for (const reschedule of activeReschedules) {
        // a) Nullify the workout on the original day
        const originalEntry = entriesMap.get(reschedule.originalDayOfWeek);
        // Check if the entry exists and if the workout matches the one rescheduled
        if (
          originalEntry &&
          originalEntry.workoutPlanId === reschedule.workoutPlanId
        ) {
          this.logger.log(
            `  - Removing workout ${reschedule.workoutPlanId} from ${reschedule.originalDayOfWeek}`,
          );
          originalEntry.workoutPlan = null;
          originalEntry.workoutPlanId = null;
          // Add a note to the original day
          originalEntry.notes =
            `(Workout moved to ${reschedule.rescheduledToDayOfWeek}) ${
              originalEntry.notes || ''
            }`.trim();
        } else {
          this.logger.warn(
            `  - Could not find original entry or workout mismatch for ${reschedule.originalDayOfWeek} (Workout ID: ${reschedule.workoutPlanId})`,
          );
        }

        // b) Add/Update the workout on the rescheduled day
        let targetEntry = entriesMap.get(reschedule.rescheduledToDayOfWeek);
        this.logger.log(
          `  - Moving workout ${reschedule.workoutPlanId} (${reschedule.workoutPlan?.name}) to ${reschedule.rescheduledToDayOfWeek}`,
        );

        // If the target day doesn't have an entry (shouldn't happen with getOrCreateSchedule logic)
        if (!targetEntry) {
          this.logger.error(
            `  - Target entry for ${reschedule.rescheduledToDayOfWeek} not found! This indicates an issue with schedule creation. Creating temporary placeholder.`,
          );
          // Create a temporary placeholder - this won't be saved but allows applying the reschedule
          targetEntry = new UserScheduleEntry();
          targetEntry.dayOfWeek = reschedule.rescheduledToDayOfWeek;
          targetEntry.schedule = schedule; // Link back
          schedule.entries.push(targetEntry); // Add to the schedule's entries array for return
          entriesMap.set(reschedule.rescheduledToDayOfWeek, targetEntry); // Add to map
        }

        // Apply the rescheduled workout details
        targetEntry.workoutPlan = reschedule.workoutPlan; // Assign the loaded workout plan object
        targetEntry.workoutPlanId = reschedule.workoutPlanId; // Assign the ID
        targetEntry.notes =
          `(Rescheduled from ${reschedule.originalDayOfWeek}) ${
            targetEntry.notes || ''
          }`.trim();
        // Decide how to handle preferredTime - keep target day's or use original?
        // targetEntry.preferredTime = originalEntry?.preferredTime || targetEntry.preferredTime;
      }
      // The modifications are made directly to the 'schedule.entries' array.
    }

    // 5. Return the potentially modified schedule object
    this.logger.log(`Returning schedule for user ${userId}`);
    return schedule;
  }

  // --- Other methods remain largely unchanged ---
  // They should operate on the BASE schedule data.
  // The skip detection logic (in a separate cron job) will create the TemporarySchedule records.

  /**
   * Update a user's schedule metadata (name, isActive)
   */
  async updateSchedule(
    userId: number,
    updateScheduleDto: UpdateScheduleDto,
  ): Promise<UserSchedule> {
    // This method doesn't need to consider temporary reschedules
    this.logger.log(`Updating schedule metadata for user ${userId}`);
    const schedule = await this.getOrCreateSchedule(userId); // Fetch base schedule

    // Apply updates from DTO
    Object.assign(schedule, updateScheduleDto);

    await this.userScheduleRepository.save(schedule);
    return this.getOrCreateSchedule(userId); // Return potentially modified schedule
  }

  /**
   * Update a BASE schedule entry for a specific day
   * This is used by the user when manually editing their schedule.
   */
  async updateScheduleEntry(
    userId: number,
    day: WeekDay,
    updateEntryDto: UpdateScheduleEntryDto,
  ): Promise<UserScheduleEntry> {
    // This method updates the BASE schedule entry.
    // Temporary reschedules are applied when GETTING the schedule.
    this.logger.log(
      `Updating BASE schedule entry for user ${userId}, day ${day}`,
    );
    this.logger.debug(`Update data:`, updateEntryDto);

    if (!Object.values(WeekDay).includes(day)) {
      throw new BadRequestException(`Invalid day: ${day}`);
    }

    const schedule = await this.getOrCreateSchedule(userId); // Ensures schedule exists
    const entry = schedule.entries?.find((e) => e.dayOfWeek === day);

    if (!entry) {
      // This case should ideally be handled by getOrCreateSchedule ensuring all entries exist
      this.logger.error(`Schedule entry for ${day} not found during update!`);
      throw new NotFoundException(`Schedule entry for ${day} not found`);
    }

    this.logger.log(`Found base entry ID ${entry.id} for day ${day}`);

    try {
      // Use update method for partial updates and handling null
      await this.scheduleEntryRepository.update(
        { id: entry.id },
        {
          workoutPlanId: updateEntryDto.workoutPlanId,
          preferredTime: updateEntryDto.preferredTime,
          notes: updateEntryDto.notes,
        },
      );

      // Fetch the updated entry with relations to return it
      const updatedEntry = await this.scheduleEntryRepository.findOne({
        where: { id: entry.id },
        relations: ['workoutPlan'],
      });

      if (!updatedEntry) {
        throw new NotFoundException(
          'Failed to find updated entry after update',
        );
      }
      this.logger.log(`Successfully updated base entry ID ${entry.id}`);
      return updatedEntry;
    } catch (error) {
      this.logger.error(
        `Error updating base entry: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Failed to update schedule entry: ${error.message}`,
      );
    }
  }

  /**
   * Set a BASE day to rest (clear workout assignment)
   */
  async setDayToRest(userId: number, day: WeekDay): Promise<UserScheduleEntry> {
    this.logger.log(`Setting BASE ${day} to rest day for user ${userId}`);
    // This calls updateScheduleEntry, which operates on the base schedule
    return this.updateScheduleEntry(userId, day, {
      workoutPlanId: null,
      preferredTime: null,
      notes: null, // Clear notes when setting to rest? Or keep them? Decide.
    });
  }

  /**
   * Reset the entire BASE schedule (set all days to rest)
   */
  async resetSchedule(userId: number): Promise<UserSchedule> {
    this.logger.log(`Resetting BASE schedule for user ${userId}`);
    const schedule = await this.getOrCreateSchedule(userId); // Ensure schedule exists

    if (schedule.entries?.length > 0) {
      const entryIds = schedule.entries.map((entry) => entry.id);
      await this.scheduleEntryRepository.update(
        { id: In(entryIds) },
        { workoutPlanId: null, preferredTime: null, notes: null }, // Clear notes on reset?
      );
      this.logger.log(
        `Cleared workout assignments for entries: ${entryIds.join(', ')}`,
      );
    }

    // Return the schedule, which will have entries with null workoutPlanId
    // Need to reload to reflect the update in the returned object
    return this.getOrCreateSchedule(userId);
  }
}
