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
// import { TemporarySchedule } from './entities/temporary-schedule.entity'; // Commented out
// Import WorkoutPlan if needed for relations, though it might come via relations
// import { WorkoutPlan } from '../../workout_plans/entities/workout_plan.entity';
import { TimeService } from '../common/time.service';

// Helper to map Date().getDay() to WeekDay enum string (or your frontend's string directly)
// Ensure WeekDay enum values match these strings if you use WeekDay enum for dayOfWeek property
const getDayOfWeekStringFromDate = (date: Date): WeekDay => {
  const dayIndex = date.getDay(); // 0 for Sunday, 1 for Monday, etc.
  const dayMap: WeekDay[] = [
    WeekDay.SUNDAY,
    WeekDay.MONDAY,
    WeekDay.TUESDAY,
    WeekDay.WEDNESDAY,
    WeekDay.THURSDAY,
    WeekDay.FRIDAY,
    WeekDay.SATURDAY,
  ];
  return dayMap[dayIndex];
};

@Injectable()
export class UserScheduleService {
  private readonly logger = new Logger(UserScheduleService.name);

  constructor(
    @InjectRepository(UserSchedule)
    private userScheduleRepository: Repository<UserSchedule>,
    @InjectRepository(UserScheduleEntry)
    private scheduleEntryRepository: Repository<UserScheduleEntry>,
    // @InjectRepository(TemporarySchedule) // Commented out
    // private tempScheduleRepository: Repository<TemporarySchedule>, // Commented out
    private readonly timeService: TimeService,
  ) {}

  private getCurrentWeekStartDate(referenceDate?: Date): Date {
    const today = referenceDate || this.timeService.getToday();
    const currentDay = new Date(today);
    const dayOfWeek = currentDay.getDay();
    const diff = currentDay.getDate() - dayOfWeek;
    const weekStart = new Date(currentDay.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
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
    // getCurrentWeekStartDate now uses TimeService
    // const weekStartDate = this.getCurrentWeekStartDate(); // Commented out
    // const activeReschedules = await this.tempScheduleRepository.find({ // Commented out
    //   where: { // Commented out
    //     user: { id: userId }, // Commented out
    //     weekStartDate: weekStartDate, // Commented out
    //   }, // Commented out
    //   relations: ['workoutPlan'], // Load the workout plan associated with the reschedule // Commented out
    //   order: { createdAt: 'ASC' }, // Apply in order they were created if needed // Commented out
    // }); // Commented out

    // 4. Apply the reschedules if any exist
    // if (activeReschedules.length > 0) { // Commented out
    //   this.logger.log( // Commented out
    //     `Applying ${ // Commented out
    //       activeReschedules.length // Commented out
    //     } reschedules for user ${userId}, week starting ${ // Commented out
    //       weekStartDate.toISOString().split('T')[0] // Commented out
    //     }`, // Commented out
    //   ); // Commented out

    //   // Create a map for quick lookup of entries by dayOfWeek // Commented out
    //   const entriesMap = new Map<WeekDay, UserScheduleEntry>(); // Commented out
    //   schedule.entries.forEach((entry) => // Commented out
    //     entriesMap.set(entry.dayOfWeek, entry), // Commented out
    //   ); // Commented out

    //   for (const reschedule of activeReschedules) { // Commented out
    //     // a) Nullify the workout on the original day // Commented out
    //     const originalEntry = entriesMap.get(reschedule.originalDayOfWeek); // Commented out
    //     // Check if the entry exists and if the workout matches the one rescheduled // Commented out
    //     if ( // Commented out
    //       originalEntry && // Commented out
    //       originalEntry.workoutPlanId === reschedule.workoutPlanId // Commented out
    //     ) { // Commented out
    //       this.logger.log( // Commented out
    //         `  - Removing workout ${reschedule.workoutPlanId} from ${reschedule.originalDayOfWeek}`, // Commented out
    //       ); // Commented out
    //       originalEntry.workoutPlan = null; // Commented out
    //       originalEntry.workoutPlanId = null; // Commented out
    //       // Add a note to the original day // Commented out
    //       originalEntry.notes = // Commented out
    //         `(Workout moved to ${reschedule.rescheduledToDayOfWeek}) ${ // Commented out
    //           originalEntry.notes || '' // Commented out
    //         }`.trim(); // Commented out
    //     } else { // Commented out
    //       this.logger.warn( // Commented out
    //         `  - Could not find original entry or workout mismatch for ${reschedule.originalDayOfWeek} (Workout ID: ${reschedule.workoutPlanId})`, // Commented out
    //       ); // Commented out
    //     } // Commented out

    //     // b) Add/Update the workout on the rescheduled day // Commented out
    //     let targetEntry = entriesMap.get(reschedule.rescheduledToDayOfWeek); // Commented out
    //     this.logger.log( // Commented out
    //       `  - Moving workout ${reschedule.workoutPlanId} (${reschedule.workoutPlan?.name}) to ${reschedule.rescheduledToDayOfWeek}`, // Commented out
    //     ); // Commented out

    //     // If the target day doesn't have an entry (shouldn't happen with getOrCreateSchedule logic) // Commented out
    //     if (!targetEntry) { // Commented out
    //       this.logger.error( // Commented out
    //         `  - Target entry for ${reschedule.rescheduledToDayOfWeek} not found! This indicates an issue with schedule creation. Creating temporary placeholder.`, // Commented out
    //       ); // Commented out
    //       // Create a temporary placeholder - this won't be saved but allows applying the reschedule // Commented out
    //       targetEntry = new UserScheduleEntry(); // Commented out
    //       targetEntry.dayOfWeek = reschedule.rescheduledToDayOfWeek; // Commented out
    //       targetEntry.schedule = schedule; // Link back // Commented out
    //       schedule.entries.push(targetEntry); // Add to the schedule's entries array for return // Commented out
    //       entriesMap.set(reschedule.rescheduledToDayOfWeek, targetEntry); // Add to map // Commented out
    //     } // Commented out

    //     // Apply the rescheduled workout details // Commented out
    //     targetEntry.workoutPlan = reschedule.workoutPlan; // Assign the loaded workout plan object // Commented out
    //     targetEntry.workoutPlanId = reschedule.workoutPlanId; // Assign the ID // Commented out
    //     targetEntry.notes = // Commented out
    //       `(Rescheduled from ${reschedule.originalDayOfWeek}) ${ // Commented out
    //         targetEntry.notes || '' // Commented out
    //       }`.trim(); // Commented out
    //     // Decide how to handle preferredTime - keep target day's or use original? // Commented out
    //     // targetEntry.preferredTime = originalEntry?.preferredTime || targetEntry.preferredTime; // Commented out
    //   } // Commented out
    //   // The modifications are made directly to the 'schedule.entries' array. // Commented out
    // } // Commented out

    // 5. Return the potentially modified schedule object
    this.logger.log(`Returning schedule for user ${userId}`);
    return schedule;
  }

  /**
   * NEW METHOD: Formats the schedule for the weekly frontend view, including 'isToday'.
   */
  async getWeeklyScheduleView(userId: number): Promise<{
    name?: string;
    days: Array<{
      date: string;
      dayOfWeek: string;
      entries: UserScheduleEntry[];
      isToday: boolean;
    }>;
  }> {
    const schedule = await this.getOrCreateSchedule(userId);

    const todayFromTimeService = this.timeService.getToday(); // This is already normalized to midnight by TimeService.getToday()
    const startOfWeek = this.getCurrentWeekStartDate(todayFromTimeService);

    const formattedDays: Array<{
      date: string;
      dayOfWeek: string;
      entries: UserScheduleEntry[];
      isToday: boolean;
    }> = [];

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);
      // currentDate is also at midnight because startOfWeek is at midnight
      // and setDate() preserves the time component.

      const dayOfWeekString =
        getDayOfWeekStringFromDate(currentDate).toLowerCase();

      const entriesForDay = schedule.entries.filter(
        (entry) => entry.dayOfWeek.toLowerCase() === dayOfWeekString,
      );

      formattedDays.push({
        date: currentDate.toISOString().split('T')[0],
        dayOfWeek: dayOfWeekString,
        entries: entriesForDay,
        isToday: currentDate.getTime() === todayFromTimeService.getTime(), // Corrected line
      });
    }

    return {
      name: schedule.name,
      days: formattedDays,
    };
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
    return this.getOrCreateSchedule(userId);
  }
}
