// filepath: c:\Users\Lenovo\Desktop\UOB\sem6\Senior\dracofit\dracofit-backend\src\streaks\streaks.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pet, PetAnimation } from '../user-pets/entities/user-pet.entity'; // Ensure PetAnimation.HAPPY is defined here
import { TimeService } from '../common/time.service';
import { UserScheduleService } from '../user-schedule/user-schedule.service';
import { UserSchedule } from '../user-schedule/entities/user-schedule.entity';
import { WeekDay } from '../user-schedule/entities/user-schedule-entry.entity';

const MAX_HEALTH_DEFAULT = 100; // Define max health for pet
const HEAL_AMOUNT_ON_WORKOUT = 5; // Heal by 5 HP

@Injectable()
export class StreaksService {
  private readonly logger = new Logger(StreaksService.name);

  private readonly dayIndexToWeekDay: WeekDay[] = [
    WeekDay.SUNDAY,
    WeekDay.MONDAY,
    WeekDay.TUESDAY,
    WeekDay.WEDNESDAY,
    WeekDay.THURSDAY,
    WeekDay.FRIDAY,
    WeekDay.SATURDAY,
  ];

  constructor(
    @InjectRepository(Pet)
    private petRepository: Repository<Pet>,
    private readonly timeService: TimeService,
    private readonly userScheduleService: UserScheduleService,
  ) {}

  private getDayOfWeekForDate(date: Date): WeekDay {
    return this.dayIndexToWeekDay[date.getDay()];
  }

  private async isScheduledWorkoutDay(
    dateToCheck: Date,
    schedule: UserSchedule | null,
  ): Promise<boolean> {
    if (!schedule || !schedule.entries || schedule.entries.length === 0) {
      this.logger.warn(
        `[StreaksService] User schedule or entries not available/empty for isScheduledWorkoutDay check on ${dateToCheck.toDateString()}. Assuming not a workout day.`,
      );
      return false; // Default to not a workout day if schedule is missing or has no entries
    }

    const dayOfWeekString = this.getDayOfWeekForDate(dateToCheck);
    const entryForDay = schedule.entries.find(
      (entry) => entry.dayOfWeek === dayOfWeekString,
    );

    if (entryForDay) {
      const isWorkout =
        entryForDay.workoutPlanId !== null &&
        entryForDay.workoutPlanId !== undefined;
      this.logger.log(
        `[StreaksService] Schedule check for ${dateToCheck.toDateString()} (${dayOfWeekString}): workoutPlanId is ${entryForDay.workoutPlanId}. Is workout: ${isWorkout}`,
      );
      return isWorkout;
    }
    this.logger.log(
      `[StreaksService] No schedule entry found for ${dateToCheck.toDateString()} (${dayOfWeekString}). Assuming not a workout day.`,
    );
    return false; // No entry for the day means it's a rest day according to the schedule structure
  }

  async recordWorkoutCompletion(userId: number): Promise<Pet> {
    this.logger.log(
      `[StreaksService] recordWorkoutCompletion called for user ID: ${userId}`,
    );

    const [petData, userSchedule] = await Promise.all([
      this.petRepository.findOne({ where: { user: { id: userId } } }),
      this.userScheduleService.getOrCreateSchedule(userId).catch((err) => {
        this.logger.error(
          `[StreaksService] Failed to fetch user schedule for user ID ${userId}: ${err.message}.`,
        );
        return null;
      }),
    ]);

    if (!petData) {
      this.logger.warn(
        `[StreaksService] Pet not found for user ID: ${userId}.`,
      );
      throw new NotFoundException(`Pet not found for user ID: ${userId}`);
    }

    let pet = { ...petData };

    let usableLastStreakDate: Date | null = null;
    if (pet.lastStreakDate) {
      if (
        pet.lastStreakDate instanceof Date &&
        !isNaN(pet.lastStreakDate.getTime())
      ) {
        usableLastStreakDate = new Date(pet.lastStreakDate);
      } else if (typeof pet.lastStreakDate === 'string') {
        const tempDate = new Date(pet.lastStreakDate);
        if (!isNaN(tempDate.getTime())) {
          usableLastStreakDate = tempDate;
          this.logger.log(
            `[StreaksService] Parsed string lastStreakDate "${pet.lastStreakDate}" to: ${usableLastStreakDate.toISOString()}`,
          );
        } else {
          this.logger.error(
            `[StreaksService] Failed to parse string lastStreakDate: "${pet.lastStreakDate}"`,
          );
        }
      } else {
        this.logger.error(
          `[StreaksService] lastStreakDate is neither a valid Date nor a string. Type: ${typeof pet.lastStreakDate}, Value: ${pet.lastStreakDate}`,
        );
      }
    }

    const todayFromTimeService = this.timeService.getToday();
    const today = new Date(todayFromTimeService);
    const todayNormalized = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    this.logger.log(
      `[StreaksService] Today (normalized to local midnight): ${todayNormalized.toISOString()} (${todayNormalized.toDateString()})`,
    );
    if (usableLastStreakDate) {
      this.logger.log(
        `[StreaksService] Usable last streak date: ${usableLastStreakDate.toISOString()}`,
      );
    }

    if (pet.currentAnimation === PetAnimation.DEAD) {
      this.logger.log(
        `[StreaksService] Pet ID ${pet.id} is dead. Streak, Health, and Animation not updated.`,
      );
      return pet;
    }

    let lastRecordedDayNormalized: Date | null = null;
    if (usableLastStreakDate) {
      lastRecordedDayNormalized = new Date(
        usableLastStreakDate.getFullYear(),
        usableLastStreakDate.getMonth(),
        usableLastStreakDate.getDate(),
      );
    }

    // --- Streak Logic ---
    if (usableLastStreakDate === null) {
      pet.currentStreak = 1;
      this.logger.log(
        `[StreaksService] First workout for pet ID: ${pet.id}. Streak set to 1.`,
      );
    } else {
      const diffTime =
        todayNormalized.getTime() - lastRecordedDayNormalized!.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      this.logger.log(
        `[StreaksService] Pet ID ${pet.id} - diffDays: ${diffDays} (Today: ${todayNormalized.toDateString()}, LastRecorded: ${lastRecordedDayNormalized!.toDateString()})`,
      );

      if (diffDays === 0) {
        this.logger.log(
          `[StreaksService] Workout logged on same day for pet ID: ${pet.id}. Current streak: ${pet.currentStreak}. No change to streak count.`,
        );
        if (pet.currentStreak === 0) pet.currentStreak = 1;
      } else if (diffDays === 1) {
        pet.currentStreak++;
        this.logger.log(
          `[StreaksService] Consecutive day workout for pet ID: ${pet.id}. New streak: ${pet.currentStreak}.`,
        );
      } else if (diffDays > 1) {
        let missedScheduledWorkoutDay = false;
        if (userSchedule) {
          for (let i = 1; i < diffDays; i++) {
            const missedDay = new Date(lastRecordedDayNormalized!);
            missedDay.setDate(lastRecordedDayNormalized!.getDate() + i);
            if (await this.isScheduledWorkoutDay(missedDay, userSchedule)) {
              missedScheduledWorkoutDay = true;
              break;
            }
          }
        } else {
          missedScheduledWorkoutDay = true;
        }
        if (missedScheduledWorkoutDay) {
          pet.currentStreak = 1;
          this.logger.log(
            `[StreaksService] Pet ID ${pet.id}: Missed scheduled day(s). Streak reset to 1.`,
          );
        } else {
          pet.currentStreak++;
          this.logger.log(
            `[StreaksService] Pet ID ${pet.id}: No scheduled days missed. Streak continued to ${pet.currentStreak}.`,
          );
        }
      } else {
        pet.currentStreak = 1;
        this.logger.warn(
          `[StreaksService] Last streak date was in the future. Resetting streak to 1 for pet ID ${pet.id}`,
        );
      }
    }
    if (pet.currentStreak > pet.longestStreak) {
      pet.longestStreak = pet.currentStreak;
    }
    pet.lastStreakDate = today;
    // --- End of Streak Logic ---

    // Determine if healing should apply
    let shouldHealToday = false;
    if (lastRecordedDayNormalized === null) {
      shouldHealToday = true;
      this.logger.log(
        `[StreaksService] Pet ID ${pet.id}: First ever workout, should heal.`,
      );
    } else if (
      lastRecordedDayNormalized.getTime() < todayNormalized.getTime()
    ) {
      shouldHealToday = true;
      this.logger.log(
        `[StreaksService] Pet ID ${pet.id}: Last workout on ${lastRecordedDayNormalized.toDateString()}, today is ${todayNormalized.toDateString()}. Should heal.`,
      );
    } else {
      this.logger.log(
        `[StreaksService] Pet ID ${pet.id}: Last workout on ${lastRecordedDayNormalized.toDateString()}, today is ${todayNormalized.toDateString()}. Subsequent workout, should NOT heal again.`,
      );
    }

    if (shouldHealToday) {
      if (pet.healthPoints < MAX_HEALTH_DEFAULT) {
        const oldHealth = pet.healthPoints;
        const newHealth = Math.min(
          MAX_HEALTH_DEFAULT,
          pet.healthPoints + HEAL_AMOUNT_ON_WORKOUT,
        );
        if (newHealth > oldHealth) {
          pet.healthPoints = newHealth;
          this.logger.log(
            `[StreaksService] Pet ID ${pet.id} healed from ${oldHealth} to ${newHealth}.`,
          );
          // Animation change due to health recovery (SAD to IDLE)
          if (
            pet.currentAnimation === PetAnimation.SAD &&
            pet.healthPoints >= MAX_HEALTH_DEFAULT * 0.3
          ) {
            pet.currentAnimation = PetAnimation.IDLE; // Becomes IDLE if it was SAD and recovered
            this.logger.log(
              `[StreaksService] Pet ID ${pet.id} animation changed to ${pet.currentAnimation} due to health increase (was SAD).`,
            );
          }
        } else {
          this.logger.log(
            `[StreaksService] Pet ID ${pet.id} health calculation resulted in no change (${oldHealth} to ${newHealth}). Max: ${MAX_HEALTH_DEFAULT}, HealAmount: ${HEAL_AMOUNT_ON_WORKOUT}`,
          );
        }
      } else {
        this.logger.log(
          `[StreaksService] Pet ID ${pet.id} is already at max health (${pet.healthPoints}). No healing applied.`,
        );
      }
    } else {
      this.logger.log(
        `[StreaksService] Pet ID ${pet.id} - Healing condition not met. No healing applied.`,
      );
    }

    // Animation change due to streak (overrides IDLE if applicable, but not DEAD)
    if (pet.currentStreak >= 2) {
      if (pet.currentAnimation !== PetAnimation.HAPPY) {
        pet.currentAnimation = PetAnimation.HAPPY;
        this.logger.log(
          `[StreaksService] Pet ID ${pet.id} animation changed to HAPPY due to streak of ${pet.currentStreak}.`,
        );
      }
    } else if (
      pet.currentStreak < 2 &&
      pet.currentAnimation === PetAnimation.HAPPY
    ) {
      // If streak drops below 2 and pet was HAPPY (and not dead), revert to IDLE
      // (or SAD if health is low, which would be handled by a separate health check logic, e.g. daily task)
      // For now, just revert to IDLE if it was HAPPY due to streak.
      // More complex logic for SAD state would be in a daily health update task.
      if (pet.healthPoints < MAX_HEALTH_DEFAULT * 0.3) {
        pet.currentAnimation = PetAnimation.SAD;
        this.logger.log(
          `[StreaksService] Pet ID ${pet.id} animation changed to SAD as streak dropped and health is low.`,
        );
      } else {
        pet.currentAnimation = PetAnimation.IDLE;
        this.logger.log(
          `[StreaksService] Pet ID ${pet.id} animation changed to IDLE as streak dropped below 2 (was HAPPY).`,
        );
      }
    }

    this.logger.log(
      `[StreaksService] Pet ID: ${pet.id} - Attempting to save. LastStreakDate: ${pet.lastStreakDate?.toISOString()}, Streak: ${pet.currentStreak}, Health: ${pet.healthPoints}, Animation: ${pet.currentAnimation}`,
    );

    const savedPet = await this.petRepository.save(pet);
    this.logger.log(
      `[StreaksService] Pet ID: ${savedPet.id} - Saved. DB LastStreakDate: ${savedPet.lastStreakDate?.toISOString()}, Health: ${savedPet.healthPoints}, Animation: ${savedPet.currentAnimation}`,
    );
    return savedPet;
  }

  // ... (rest of your existing methods like checkAndResetStreak, if any, from your context file) ...
}
