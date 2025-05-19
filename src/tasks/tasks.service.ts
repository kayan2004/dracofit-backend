import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { WorkoutLogsService } from '../workout-logs/workout-logs.service';
import { TemporarySchedule } from '../user-schedule/entities/temporary-schedule.entity';
import {
  UserScheduleEntry,
  WeekDay,
} from '../user-schedule/entities/user-schedule-entry.entity';
import { UserPetsService } from '../user-pets/user-pets.service'; // Adjust path as needed
import { TimeService } from '../common/time.service'; // Import TimeService

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly workoutLogsService: WorkoutLogsService,
    @InjectRepository(TemporarySchedule)
    private tempScheduleRepository: Repository<TemporarySchedule>,
    // Inject UserScheduleEntry repository directly to query the base schedule reliably
    @InjectRepository(UserScheduleEntry)
    private scheduleEntryRepository: Repository<UserScheduleEntry>,
    private readonly userPetsService: UserPetsService,
    private readonly timeService: TimeService, // Inject TimeService
  ) {}

  // --- Helper Functions ---

  private getWeekDayFromDate(date: Date): WeekDay {
    const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, ...
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
  }

  private getDayIndex(day: WeekDay): number {
    const dayMap = {
      [WeekDay.SUNDAY]: 0,
      [WeekDay.MONDAY]: 1,
      [WeekDay.TUESDAY]: 2,
      [WeekDay.WEDNESDAY]: 3,
      [WeekDay.THURSDAY]: 4,
      [WeekDay.FRIDAY]: 5,
      [WeekDay.SATURDAY]: 6,
    };
    return dayMap[day];
  }

  private getDayIdFromIndex(index: number): WeekDay {
    const dayMap: WeekDay[] = [
      WeekDay.SUNDAY,
      WeekDay.MONDAY,
      WeekDay.TUESDAY,
      WeekDay.WEDNESDAY,
      WeekDay.THURSDAY,
      WeekDay.FRIDAY,
      WeekDay.SATURDAY,
    ];
    return dayMap[index % 7];
  }

  private getCurrentWeekStartDate(today: Date = new Date()): Date {
    const currentDay = new Date(today); // Clone to avoid modifying original
    const dayOfWeek = currentDay.getDay(); // 0 for Sunday
    const diff = currentDay.getDate() - dayOfWeek;
    const weekStart = new Date(currentDay.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }

  // --- Scheduled Task ---

  // Temporarily change for testing:
  @Cron(CronExpression.EVERY_DAY_AT_1AM, {
    // Reverted from EVERY_10_SECONDS
    // Or EVERY_30_SECONDS
    name: 'checkSkippedWorkouts',
    timeZone: 'Asia/Bahrain', // Keep your timezone
  })
  async handleCronCheckSkippedWorkouts() {
    this.logger.log('Running daily check for skipped workouts...');

    const today = this.timeService.getToday(); // Use TimeService
    const yesterday = new Date(today); // Still okay to derive yesterday from TimeService's today
    yesterday.setDate(today.getDate() - 1);
    const yesterdayWeekDay = this.getWeekDayFromDate(yesterday);
    const yesterdayStart = new Date(yesterday);
    yesterdayStart.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);

    const currentWeekStartDate = this.getCurrentWeekStartDate(today);

    // 1. Get all active users (or users with schedules)
    // Adjust this based on how you fetch users (e.g., usersService.findAllActive())
    const users = await this.usersService.findAll(); // Assuming this gets all users
    this.logger.log(`Checking ${users.length} users.`);

    for (const user of users) {
      try {
        // 2. Get the user's BASE schedule entry for YESTERDAY
        const yesterdayBaseEntry = await this.scheduleEntryRepository.findOne({
          where: {
            schedule: { userId: user.id }, // Assuming relation is named 'schedule' in UserScheduleEntry
            dayOfWeek: yesterdayWeekDay,
          },
          // No relations needed here, just the workoutPlanId
        });

        // 3. Check if a workout was scheduled for yesterday
        if (yesterdayBaseEntry?.workoutPlanId) {
          const workoutPlanIdToCheck = yesterdayBaseEntry.workoutPlanId;
          this.logger.debug(
            `User ${user.id}: Workout ${workoutPlanIdToCheck} scheduled for ${yesterdayWeekDay}. Checking logs...`,
          );

          // 4. Check if the workout was logged yesterday
          const logs = await this.workoutLogsService.getLogsByDateRange(
            user.id,
            yesterdayStart,
            yesterdayEnd,
            workoutPlanIdToCheck,
          );

          // 5. If NO logs found -> Workout was SKIPPED
          if (logs.length === 0) {
            this.logger.log(
              `User ${user.id}: Workout ${workoutPlanIdToCheck} for ${yesterdayWeekDay} was SKIPPED.`,
            );

            // 6. Check if already rescheduled for this week
            const existingReschedule =
              await this.tempScheduleRepository.findOne({
                where: {
                  userId: user.id,
                  originalDayOfWeek: yesterdayWeekDay,
                  workoutPlanId: workoutPlanIdToCheck,
                  weekStartDate: currentWeekStartDate,
                },
              });

            if (existingReschedule) {
              this.logger.log(
                `User ${user.id}: Workout ${workoutPlanIdToCheck} already rescheduled this week. Skipping.`,
              );
              continue; // Move to the next user
            }

            // 7. Find the next available day in the BASE schedule (this week, starting today)
            const baseScheduleEntries = await this.scheduleEntryRepository.find(
              {
                where: { schedule: { userId: user.id } },
                order: { dayOfWeek: 'ASC' }, // Optional, but helps visualize
              },
            );

            let rescheduledDay: WeekDay | null = null;
            const todayIndex = this.getDayIndex(this.getWeekDayFromDate(today));
            const yesterdayIndex = this.getDayIndex(yesterdayWeekDay);

            for (let i = 0; i < 7; i++) {
              // Check next 7 days starting from today
              const checkIndex = (todayIndex + i) % 7;
              // Don't reschedule onto the original skipped day
              if (checkIndex === yesterdayIndex) continue;

              const checkDayId = this.getDayIdFromIndex(checkIndex);
              const entryForCheckDay = baseScheduleEntries.find(
                (e) => e.dayOfWeek === checkDayId,
              );

              // Found an empty slot if entry exists and has no workout, or if no entry exists for that day (shouldn't happen with default entries)
              if (entryForCheckDay && !entryForCheckDay.workoutPlanId) {
                rescheduledDay = checkDayId;
                this.logger.log(
                  `User ${user.id}: Found available slot for reschedule: ${rescheduledDay}`,
                );
                break;
              }
            }

            // 8. If an available day was found, create the TemporarySchedule record
            if (rescheduledDay) {
              const newReschedule = this.tempScheduleRepository.create({
                userId: user.id,
                originalDayOfWeek: yesterdayWeekDay,
                workoutPlanId: workoutPlanIdToCheck,
                rescheduledToDayOfWeek: rescheduledDay,
                weekStartDate: currentWeekStartDate,
              });
              await this.tempScheduleRepository.save(newReschedule);
              this.logger.log(
                `User ${user.id}: Created TemporarySchedule record ID ${newReschedule.id}.`,
              );
            } else {
              this.logger.log(
                `User ${user.id}: No available slot found this week to reschedule workout ${workoutPlanIdToCheck}.`,
              );
            }
          } else {
            this.logger.debug(
              `User ${user.id}: Workout ${workoutPlanIdToCheck} for ${yesterdayWeekDay} was logged. Count: ${logs.length}`,
            );
          }
        } else {
          this.logger.debug(
            `User ${user.id}: No workout scheduled for ${yesterdayWeekDay}.`,
          );
        }
      } catch (error) {
        if (error instanceof Error) {
          this.logger.error(
            `Error processing user ${user.id} for skipped workouts: ${error.message}`,
            error.stack,
          );
        } else {
          this.logger.error(
            `Error processing user ${user.id} for skipped workouts: ${String(error)}`,
          );
        }
      }
    }
    this.logger.log('Finished daily check for skipped workouts.');
  }

  // Optional: Add a cleanup task for old records
  @Cron('0 2 * * 1', {
    // Run at 2:00 AM every Monday (0=Sun, 1=Mon, ...)
    name: 'cleanupOldReschedules',
    timeZone: 'Asia/Bahrain',
  })
  async handleCronCleanupOldReschedules() {
    this.logger.log('Running weekly cleanup of old temporary reschedules...');
    const lastWeekStartDate = this.getCurrentWeekStartDate();
    // Calculate the start date of the week *before* the current one
    lastWeekStartDate.setDate(lastWeekStartDate.getDate() - 7);

    try {
      const deleteResult = await this.tempScheduleRepository.delete({
        weekStartDate: LessThan(lastWeekStartDate),
      });
      this.logger.log(
        `Deleted ${deleteResult.affected || 0} old temporary reschedule records.`,
      );
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Error cleaning up old reschedules: ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error(
          `Error cleaning up old reschedules: ${String(error)}`,
        );
      }
    }
  }

  // Example: Run daily at 3 AM server time
  @Cron(CronExpression.EVERY_DAY_AT_3AM) // Reverted from EVERY_10_SECONDS
  async handleDailyPetHealthDecay() {
    this.logger.log('Scheduled task: handleDailyPetHealthDecay starting...');
    try {
      await this.userPetsService.applyDailyHealthDecayToAllActivePets();
      this.logger.log(
        'Scheduled task: handleDailyPetHealthDecay completed successfully.',
      );
    } catch (error) {
      this.logger.error(
        `Scheduled task: handleDailyPetHealthDecay failed: ${error.message}`,
        error.stack,
      );
    }
  }

  // You might have other scheduled tasks here
}
