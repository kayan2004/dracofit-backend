import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pet, PetStage, PetAnimation } from './entities/user-pet.entity';
import { CreatePetDto } from './dto/create-user-pet.dto';
import { UpdatePetDto } from './dto/update-user-pet.dto';
import { User } from '../users/entities/user.entity';
import { TimeService } from '../common/time.service';
import { UserScheduleService } from '../user-schedule/user-schedule.service';
import { UserSchedule } from '../user-schedule/entities/user-schedule.entity';
import { WeekDay } from '../user-schedule/entities/user-schedule-entry.entity';

const XP_PER_LEVEL = 100; // XP needed to gain one level
const MAX_HEALTH_DEFAULT = 100; // Define default max health

@Injectable()
export class UserPetsService {
  private readonly logger = new Logger(UserPetsService.name);

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
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly timeService: TimeService,
    private readonly userScheduleService: UserScheduleService,
  ) {}

  /**
   * Creates a new pet for a user, typically upon user registration.
   * Ensures default values are set.
   */
  async create(userId: number, createPetDto: CreatePetDto): Promise<Pet> {
    this.logger.log(
      `Attempting to create pet for user ID: ${userId} with DTO: ${JSON.stringify(createPetDto)}`,
    );
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    const existingPet = await this.petRepository.findOne({
      where: { user: { id: userId } },
    });
    if (existingPet) {
      this.logger.warn(
        `User ID ${userId} already has a pet (ID: ${existingPet.id}). Creation aborted.`,
      );
      throw new ConflictException('User already has a pet');
    }

    const pet = this.petRepository.create({
      user: user,
      name: createPetDto.name || `${user.username}'s Draco`, // Use DTO name or default
      level: 1,
      xp: 0,
      healthPoints: MAX_HEALTH_DEFAULT, // Use defined constant
      // maxHealth: MAX_HEALTH_DEFAULT, // This field does not exist on the entity
      currentStreak: 0,
      longestStreak: 0,
      stage: PetStage.BABY,
      currentAnimation: PetAnimation.IDLE,
      isDead: false,
      resurrectionCount: 0,
      lastStreakDate: null,
    });
    this.logger.log(
      `New pet created for user ID ${userId}: ${JSON.stringify(pet)}`,
    );
    return this.petRepository.save(pet);
  }

  /**
   * Creates a new default pet, typically used after a restart.
   * This method ensures all values are reset to their initial defaults.
   */
  private async createNewDefaultPet(
    user: User,
    petName?: string,
  ): Promise<Pet> {
    const newPet = this.petRepository.create({
      user: user,
      name: petName || `${user.username}'s Draco`,
      level: 1,
      xp: 0,
      healthPoints: MAX_HEALTH_DEFAULT, // Use defined constant
      // maxHealth: MAX_HEALTH_DEFAULT, // This field does not exist on the entity
      currentStreak: 0,
      longestStreak: 0,
      stage: PetStage.BABY,
      currentAnimation: PetAnimation.IDLE,
      isDead: false,
      resurrectionCount: 0,
      lastStreakDate: null,
    });
    this.logger.log(
      `Creating new default pet for user ID ${user.id}: ${JSON.stringify(newPet)}`,
    );
    return this.petRepository.save(newPet);
  }

  /**
   * Handles the pet restart process: deletes the old pet and creates a new default one.
   */
  async handlePetRestart(userId: number): Promise<Pet> {
    this.logger.log(`Initiating pet restart for user ID: ${userId}`);
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(
        `User with ID ${userId} not found for pet restart.`,
      );
    }

    const existingPet = await this.petRepository.findOne({
      where: { user: { id: userId } },
    });
    if (existingPet) {
      await this.petRepository.remove(existingPet);
      this.logger.log(
        `Existing pet (ID: ${existingPet.id}) deleted for user ID: ${userId}`,
      );
    } else {
      this.logger.log(
        `No existing pet found to delete for user ID: ${userId}. Proceeding to create new one.`,
      );
    }

    const newPet = await this.createNewDefaultPet(user);
    this.logger.log(
      `New default pet (ID: ${newPet.id}) created for user ID: ${userId}`,
    );
    return newPet;
  }

  /**
   * Finds a user's pet.
   */
  async findByUserId(userId: number): Promise<Pet> {
    const pet = await this.petRepository.findOne({
      where: { user: { id: userId } },
    });
    if (!pet) {
      throw new NotFoundException(`Pet not found for user ID ${userId}`);
    }
    return pet;
  }

  /**
   * Updates pet information.
   */
  async update(userId: number, updatePetDto: UpdatePetDto): Promise<Pet> {
    const pet = await this.findByUserId(userId);

    // Update fields if provided in DTO
    if (updatePetDto.name !== undefined) pet.name = updatePetDto.name;
    if (updatePetDto.stage !== undefined) pet.stage = updatePetDto.stage;
    if (updatePetDto.currentAnimation !== undefined)
      pet.currentAnimation = updatePetDto.currentAnimation;
    // maxHealth is not a field, so cannot be updated from DTO

    if (updatePetDto.healthPoints !== undefined) {
      pet.healthPoints = Math.max(
        0,
        Math.min(updatePetDto.healthPoints, MAX_HEALTH_DEFAULT), // Ensure health is within 0 and MAX_HEALTH_DEFAULT
      );

      if (pet.healthPoints <= 0) {
        if (!pet.isDead) {
          // Only log death once
          this.logger.log(
            `Pet ID ${pet.id} has died. Health: ${pet.healthPoints}`,
          );
        }
        pet.isDead = true;
        pet.currentAnimation = PetAnimation.DEAD;
      } else {
        // Health > 0
        if (pet.isDead) {
          // Pet was dead and now has health (resurrection or admin update)
          this.logger.log(
            `Pet ID ${pet.id} is no longer dead. Health: ${pet.healthPoints}`,
          );
          pet.isDead = false;
          pet.currentAnimation = PetAnimation.HAPPY; // Animation for coming back to life
        } else if (
          pet.healthPoints < MAX_HEALTH_DEFAULT * 0.3 && // Use constant for threshold
          pet.currentAnimation !== PetAnimation.SAD
        ) {
          pet.currentAnimation = PetAnimation.SAD;
        } else if (
          pet.healthPoints >= MAX_HEALTH_DEFAULT * 0.3 && // Use constant for threshold
          pet.currentAnimation === PetAnimation.SAD
        ) {
          pet.currentAnimation = PetAnimation.IDLE; // Or HAPPY
        }
      }
    }
    this.logger.log(
      `Pet ID ${pet.id} updated. Data: ${JSON.stringify(updatePetDto)}`,
    );
    return this.petRepository.save(pet);
  }

  /**
   * Adds XP to pet and handles leveling/evolution.
   */
  async addXp(userId: number, xpAmount: number): Promise<Pet> {
    const pet = await this.findByUserId(userId);

    if (pet.isDead) {
      this.logger.log(`Pet ID ${pet.id} is dead. Cannot gain XP.`);
      return pet;
    }

    pet.xp += xpAmount;
    this.logger.log(
      `Pet ID ${pet.id} gained ${xpAmount} XP. Current XP: ${pet.xp}`,
    );

    let xpThresholdForNextLevel = pet.level * XP_PER_LEVEL;
    while (pet.xp >= xpThresholdForNextLevel) {
      pet.level += 1;
      pet.xp -= xpThresholdForNextLevel;
      this.logger.log(
        `Pet ID ${pet.id} leveled up to Level ${pet.level}! Remaining XP: ${pet.xp}`,
      );
      pet.currentAnimation = PetAnimation.HAPPY; // Animation for level up

      // Evolution logic based on PetStage enum
      if (pet.level >= 10 && pet.stage === PetStage.TEEN) {
        // Example: Evolve to ADULT at level 10 if TEEN
        pet.stage = PetStage.ADULT;
        this.logger.log(
          `Pet ID ${pet.id} evolved to Stage: ${PetStage.ADULT}!`,
        );
      } else if (pet.level >= 5 && pet.stage === PetStage.BABY) {
        // Example: Evolve to TEEN at level 5 if BABY
        pet.stage = PetStage.TEEN;
        this.logger.log(`Pet ID ${pet.id} evolved to Stage: ${PetStage.TEEN}!`);
      }
      xpThresholdForNextLevel = pet.level * XP_PER_LEVEL; // Recalculate for next potential level up
    }
    return this.petRepository.save(pet);
  }

  /**
   * Resurrects a dead pet.
   */
  async resurrect(userId: number): Promise<Pet> {
    const pet = await this.findByUserId(userId);

    if (!pet.isDead) {
      this.logger.warn(
        `Attempted to resurrect pet ID ${pet.id} which is not dead.`,
      );
      throw new ConflictException('Pet is not dead');
    }

    pet.healthPoints = MAX_HEALTH_DEFAULT / 2; // Resurrect with half of MAX_HEALTH_DEFAULT
    pet.isDead = false;
    pet.resurrectionCount = (pet.resurrectionCount || 0) + 1;
    pet.currentAnimation = PetAnimation.HAPPY; // Animation for resurrection
    this.logger.log(
      `Pet ID ${pet.id} resurrected. Health: ${pet.healthPoints}, Resurrection Count: ${pet.resurrectionCount}`,
    );
    return this.petRepository.save(pet);
  }

  // --- Health Decay Logic (Schedule-Aware) ---
  private getDayOfWeekForDate(date: Date): WeekDay {
    return this.dayIndexToWeekDay[date.getDay()];
  }

  private async isScheduledWorkoutDay(
    dateToCheck: Date,
    schedule: UserSchedule | null,
    userIdForLog: number,
  ): Promise<boolean> {
    if (!schedule || !schedule.entries || schedule.entries.length === 0) {
      this.logger.warn(
        `[isScheduledWorkoutDay User: ${userIdForLog}] Schedule/entries not available for ${dateToCheck.toDateString()}. Assuming not workout day.`,
      );
      return false;
    }
    const dayOfWeekString = this.getDayOfWeekForDate(dateToCheck);
    const entryForDay = schedule.entries.find(
      (entry) => entry.dayOfWeek === dayOfWeekString,
    );

    if (entryForDay) {
      return (
        entryForDay.workoutPlanId !== null &&
        entryForDay.workoutPlanId !== undefined
      );
    }
    return false;
  }

  async dailyHealthDecayForPet(
    petId: number,
    userId: number,
  ): Promise<Pet | null> {
    const pet = await this.petRepository.findOne({
      where: { id: petId, user: { id: userId } },
    });

    if (!pet) {
      this.logger.warn(
        `dailyHealthDecayForPet: Pet ID ${petId} for user ID ${userId} not found.`,
      );
      return null;
    }
    if (pet.isDead || pet.healthPoints <= 0) {
      this.logger.log(
        `dailyHealthDecayForPet: Pet ID ${pet.id} (User: ${userId}) already dead/0 HP. No decay.`,
      );
      return pet;
    }

    const today = this.timeService.getToday();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    this.logger.log(
      `[dailyHealthDecayForPet Pet ID ${pet.id} User: ${userId}] Checking decay for "yesterday": ${yesterday.toDateString()}`,
    );

    const userSchedule = await this.userScheduleService
      .getOrCreateSchedule(userId)
      .catch((err) => {
        this.logger.error(
          `[dailyHealthDecayForPet Pet ID ${pet.id} User: ${userId}] Failed to fetch schedule: ${err.message}.`,
        );
        return null;
      });

    if (!userSchedule) {
      this.logger.warn(
        `[dailyHealthDecayForPet Pet ID ${pet.id} User: ${userId}] No schedule. Skipping decay.`,
      );
      return pet;
    }

    const wasYesterdayScheduledWorkout = await this.isScheduledWorkoutDay(
      yesterday,
      userSchedule,
      userId,
    );
    if (!wasYesterdayScheduledWorkout) {
      this.logger.log(
        `[dailyHealthDecayForPet Pet ID ${pet.id} User: ${userId}] Yesterday was REST day. No decay.`,
      );
      return pet;
    }

    this.logger.log(
      `[dailyHealthDecayForPet Pet ID ${pet.id} User: ${userId}] Yesterday WAS scheduled workout. Checking if missed...`,
    );
    const lastWorkoutDate = pet.lastStreakDate
      ? new Date(pet.lastStreakDate)
      : null;
    let yesterdayWorkoutMissed = true;

    if (lastWorkoutDate) {
      const normalizedLastWorkout = new Date(lastWorkoutDate);
      normalizedLastWorkout.setHours(0, 0, 0, 0);
      if (normalizedLastWorkout.getTime() >= yesterday.getTime()) {
        yesterdayWorkoutMissed = false;
        this.logger.log(
          `[dailyHealthDecayForPet Pet ID ${pet.id} User: ${userId}] Workout logged on/after yesterday. NOT missed.`,
        );
      } else {
        this.logger.log(
          `[dailyHealthDecayForPet Pet ID ${pet.id} User: ${userId}] Last workout before yesterday. MISSED.`,
        );
      }
    } else {
      this.logger.log(
        `[dailyHealthDecayForPet Pet ID ${pet.id} User: ${userId}] No lastStreakDate. MISSED.`,
      );
    }

    if (yesterdayWorkoutMissed) {
      this.logger.log(
        `Pet ID ${pet.id} (User: ${userId}) MISSED scheduled workout. Applying health decay.`,
      );
      pet.healthPoints = Math.max(0, pet.healthPoints - 10); // Decay amount
      this.logger.log(
        `Pet ID ${pet.id} (User: ${userId}) health decreased to ${pet.healthPoints}.`,
      );

      if (pet.healthPoints <= 0) {
        pet.isDead = true;
        pet.currentAnimation = PetAnimation.DEAD;
        this.logger.log(
          `Pet ID ${pet.id} (User: ${userId}) has DIED due to health decay.`,
        );
      } else if (
        pet.healthPoints < MAX_HEALTH_DEFAULT * 0.3 && // Use constant for threshold
        pet.currentAnimation !== PetAnimation.SAD
      ) {
        pet.currentAnimation = PetAnimation.SAD;
      }
      return this.petRepository.save(pet);
    }
    return pet;
  }

  async applyDailyHealthDecayToAllActivePets(): Promise<void> {
    this.logger.log('Starting daily health decay for all active pets...');
    const activePets = await this.petRepository.find({
      where: { isDead: false },
      relations: ['user'],
    });

    if (activePets.length === 0) {
      this.logger.log('No active pets for health decay.');
      return;
    }
    this.logger.log(`Found ${activePets.length} active pets for health decay.`);

    for (const pet of activePets) {
      if (!pet.user || !pet.user.id) {
        this.logger.warn(`Pet ID ${pet.id} missing user info. Skipping decay.`);
        continue;
      }
      if (pet.healthPoints <= 0) {
        this.logger.log(
          `Pet ID ${pet.id} (User: ${pet.user.id}) already 0 HP. Skipping decay call.`,
        );
        continue;
      }
      try {
        await this.dailyHealthDecayForPet(pet.id, pet.user.id);
      } catch (error) {
        this.logger.error(
          `Error applying health decay to pet ID ${pet.id} (User: ${pet.user.id}): ${error.message}`,
          error.stack,
        );
      }
    }
    this.logger.log('Finished daily health decay process.');
  }

  /**
   * Update pet streak.
   * Note: Primary streak logic is expected to be in StreaksService.
   * This method's specific purpose needs clarification if it's actively used.
   */
  async updateStreak(userId: number): Promise<Pet> {
    this.logger.warn(
      `UserPetsService.updateStreak called for user ${userId}. Its specific logic should be reviewed or handled by StreaksService.`,
    );
    const pet = await this.findByUserId(userId);
    // No specific streak update logic here; StreaksService should handle workout-based streaks.
    // If this method has a different purpose, that logic needs to be implemented.
    return pet;
  }
}
