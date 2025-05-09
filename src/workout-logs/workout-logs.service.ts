import { Injectable, NotFoundException, Logger } from '@nestjs/common'; // Added Logger
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { WorkoutLog } from './entities/workout-log.entity';
import { CreateWorkoutLogDto } from './dto/create-workout-log.dto';
import { UpdateWorkoutLogDto } from './dto/update-workout-log.dto';
import { WorkoutPlansService } from '../workout_plans/workout_plans.service';
import { UserPetsService } from '../user-pets/user-pets.service'; // Import UserPetsService

// XP Constants (ensure these are defined)
const BASE_XP_FOR_WORKOUT = 20;
const XP_PER_EXERCISE_COMPLETED = 5;

@Injectable()
export class WorkoutLogsService {
  private readonly logger = new Logger(WorkoutLogsService.name); // Initialize logger

  constructor(
    @InjectRepository(WorkoutLog)
    private workoutLogRepository: Repository<WorkoutLog>,
    private readonly workoutPlansService: WorkoutPlansService,
    private readonly userPetsService: UserPetsService, // Inject UserPetsService
  ) {}

  /**
   * Create a new workout log (called when starting a workout)
   */
  async create(userId: number, createWorkoutLogDto: CreateWorkoutLogDto) {
    const workoutPlan = await this.workoutPlansService.findOne(
      createWorkoutLogDto.workoutPlanId,
      userId,
    );

    if (!workoutPlan) {
      throw new NotFoundException(
        `Workout plan with ID ${createWorkoutLogDto.workoutPlanId} not found or not accessible`,
      );
    }

    const now = new Date();
    const workoutLog = this.workoutLogRepository.create({
      user: { id: userId },
      workoutPlan,
      startTime: now,
      endTime: now, // Initially set endTime to now, will be updated upon completion
      xpEarned: 0, // Initialize xpEarned to 0
    });

    return this.workoutLogRepository.save(workoutLog);
  }

  /**
   * Log a completed workout (potentially for manual logging or a different flow)
   * Assumes duration is provided.
   */
  async logCompletedWorkout(
    userId: number,
    createWorkoutLogDto: CreateWorkoutLogDto,
  ) {
    const workoutPlan = await this.workoutPlansService.findOne(
      createWorkoutLogDto.workoutPlanId,
      userId,
    );

    if (!workoutPlan) {
      throw new NotFoundException(
        `Workout plan with ID ${createWorkoutLogDto.workoutPlanId} not found`,
      );
    }

    // Use nullish coalescing operator to default to 0 if undefined
    const duration = createWorkoutLogDto.durationMinutes ?? 0;

    // Calculate startTime based on the provided duration (in minutes)
    const endTime = new Date(); // Log completion time is now
    const startTime = new Date(endTime);
    // Use setMinutes since the duration is in minutes
    startTime.setMinutes(startTime.getMinutes() - duration);

    const workoutLog = this.workoutLogRepository.create({
      user: { id: userId },
      workoutPlan,
      startTime,
      endTime, // Set endTime to now
      // Do NOT set durationMinutes here - it's a virtual property
      // xpEarned: this.calculateXP( // Temporarily removed
      //   duration,
      //   workoutPlan,
      // ),
    });

    return this.workoutLogRepository.save(workoutLog);
  }

  /**
   * Get all workout logs for a user
   */
  async findAll(userId: number) {
    return this.workoutLogRepository.find({
      where: { user: { id: userId } },
      relations: ['workoutPlan'],
      order: { startTime: 'DESC' },
    });
  }

  /**
   * Get a specific workout log
   */
  async findOne(id: number, userId: number) {
    const workoutLog = await this.workoutLogRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['workoutPlan'], // workoutPlan is loaded here
    });

    if (!workoutLog) {
      throw new NotFoundException(`Workout log with ID ${id} not found`);
    }

    return workoutLog;
  }

  /**
   * Update a workout log (used for completion)
   */
  async update(
    id: number,
    userId: number,
    updateWorkoutLogDto: UpdateWorkoutLogDto,
  ) {
    const workoutLog = await this.findOne(id, userId); // workoutLog.workoutPlan is available

    // Update startTime and endTime based on DTO
    // This section is from your provided code
    if (updateWorkoutLogDto.durationMinutes !== undefined) {
      const endTime = updateWorkoutLogDto.endTime
        ? new Date(updateWorkoutLogDto.endTime)
        : workoutLog.endTime; // Use existing endTime if DTO doesn't provide one

      const startTime = new Date(endTime); // Calculate startTime based on endTime and duration
      startTime.setMinutes(
        startTime.getMinutes() - updateWorkoutLogDto.durationMinutes,
      );

      workoutLog.startTime = startTime;
      // If DTO provides endTime, use it; otherwise, if duration was provided,
      // and DTO didn't provide endTime, we might assume completion is "now" or keep existing.
      // Your original logic set it to new Date() if not provided by DTO when durationMinutes is set.
      workoutLog.endTime = updateWorkoutLogDto.endTime
        ? new Date(updateWorkoutLogDto.endTime)
        : new Date();
    } else {
      // If durationMinutes is not provided, update startTime/endTime directly if they are in DTO
      if (updateWorkoutLogDto.startTime !== undefined) {
        workoutLog.startTime = new Date(updateWorkoutLogDto.startTime);
      }
      if (updateWorkoutLogDto.endTime !== undefined) {
        workoutLog.endTime = new Date(updateWorkoutLogDto.endTime);
      }
    }

    // XP Calculation and Awarding Logic
    // Award XP if workout is being marked as completed (endTime is present and valid)
    // and XP hasn't been awarded yet (xpEarned is 0).
    if (
      workoutLog.endTime && // Ensure endTime is set
      workoutLog.endTime > workoutLog.startTime && // Ensure logical times
      (workoutLog.xpEarned === 0 ||
        workoutLog.xpEarned === null ||
        workoutLog.xpEarned === undefined) && // Check if XP not yet awarded
      updateWorkoutLogDto.endTime !== undefined // Trigger XP calculation if endTime is being explicitly set in the update
    ) {
      if (!workoutLog.workoutPlan) {
        this.logger.warn(
          `WorkoutLog ID ${workoutLog.id} is missing workoutPlan relation. Cannot calculate XP.`,
        );
      } else {
        // Fetch the plan again, this time ensuring exercises are loaded
        // The userId here is for scoping/authorization in workoutPlansService.findOne
        const planWithExercises = await this.workoutPlansService.findOne(
          workoutLog.workoutPlan.id,
          userId,
          true, // Load exercises
        );

        if (planWithExercises && planWithExercises.workoutExercises) {
          const numberOfExercises = planWithExercises.workoutExercises.length;
          const calculatedXp =
            BASE_XP_FOR_WORKOUT + numberOfExercises * XP_PER_EXERCISE_COMPLETED;

          workoutLog.xpEarned = calculatedXp;
          this.logger.log(
            `Awarding ${calculatedXp} XP to user ${userId} for completing workout log ${id}. Exercises: ${numberOfExercises}`,
          );
          try {
            await this.userPetsService.addXp(userId, calculatedXp);
            this.logger.log(
              `Successfully added ${calculatedXp} XP to pet for user ${userId}.`,
            );
          } catch (error) {
            this.logger.error(
              `Failed to add XP to pet for user ${userId}: ${error.message}`,
              error.stack,
            );
            // Consider if you want to revert workoutLog.xpEarned or handle this error differently
          }
        } else {
          this.logger.warn(
            `WorkoutPlan ID ${workoutLog.workoutPlan.id} has no exercises loaded or plan not found. Awarding base XP.`,
          );
          workoutLog.xpEarned = BASE_XP_FOR_WORKOUT; // Fallback to base XP
          try {
            await this.userPetsService.addXp(userId, BASE_XP_FOR_WORKOUT);
            this.logger.log(
              `Successfully added base ${BASE_XP_FOR_WORKOUT} XP to pet for user ${userId}.`,
            );
          } catch (error) {
            this.logger.error(
              `Failed to add base XP to pet for user ${userId}: ${error.message}`,
              error.stack,
            );
          }
        }
      }
    } else if (updateWorkoutLogDto.xpEarned !== undefined) {
      // Allow manual override of xpEarned if provided in DTO,
      // but this might conflict with automatic calculation.
      // Use with caution or remove if automatic calculation is always preferred.
      // workoutLog.xpEarned = updateWorkoutLogDto.xpEarned;
      this.logger.log(
        `XP for log ${id} was explicitly set via DTO to ${updateWorkoutLogDto.xpEarned}. Automatic calculation skipped.`,
      );
    }

    return this.workoutLogRepository.save(workoutLog);
  }

  /**
   * Delete a workout log
   */
  async remove(id: number, userId: number) {
    const workoutLog = await this.findOne(id, userId);
    return this.workoutLogRepository.remove(workoutLog);
  }

  /**
   * Get workout statistics for a user
   */
  async getStats(userId: number) {
    const logs = await this.workoutLogRepository.find({
      where: { user: { id: userId } },
      relations: ['workoutPlan'],
    });

    const totalWorkouts = logs.length;

    const totalDuration = logs.reduce(
      (sum, log) => sum + log.durationMinutes, // Use virtual getter
      0,
    );

    // const totalXP = logs.reduce((sum, log) => sum + log.xpEarned, 0); // Temporarily removed

    const workoutsByType = {};
    logs.forEach((log) => {
      if (log.workoutPlan?.type) {
        workoutsByType[log.workoutPlan.type] =
          (workoutsByType[log.workoutPlan.type] || 0) + 1;
      }
    });

    return {
      totalWorkouts,
      totalDurationMinutes: totalDuration, // Already in minutes
      // totalXP, // Temporarily removed
      workoutsByType,
      recentWorkouts: logs.slice(0, 5),
    };
  }

  /**
   * Find workout logs for a user within a specific date range, optionally for a specific plan.
   */
  async findLogsByDateRange(
    userId: number,
    startDate: Date,
    endDate: Date,
    workoutPlanId?: number, // Optional workout plan ID
  ): Promise<WorkoutLog[]> {
    const whereCondition: any = {
      user: { id: userId },
      // Check if the log's start time falls within the provided range
      startTime: Between(startDate, endDate),
    };

    // If workoutPlanId is provided, add it to the condition
    if (workoutPlanId !== undefined) {
      whereCondition.workoutPlan = { id: workoutPlanId };
    }

    return this.workoutLogRepository.find({
      where: whereCondition,
      relations: ['workoutPlan'], // Include workoutPlan if needed, maybe not necessary just for checking existence
      order: { startTime: 'ASC' }, // Order doesn't strictly matter for existence check
    });
  }

  /**
   * Calculate XP for completing a workout
   * @private
   */
  // Temporarily removed calculateXP method
  // private calculateXP(durationMinutes: number, workoutPlan: any): number {
  //   const baseXP = 50;
  //   const minutesXP = Math.max(0, Math.floor(durationMinutes)) * 10;

  //   let difficultyMultiplier = 1;
  //   switch (workoutPlan.difficulty) {
  //     case 'beginner':
  //       difficultyMultiplier = 1;
  //       break;
  //     case 'intermediate':
  //       difficultyMultiplier = 1.2;
  //       break;
  //     case 'advanced':
  //       difficultyMultiplier = 1.5;
  //       break;
  //     default:
  //       difficultyMultiplier = 1;
  //   }

  //   return Math.round((baseXP + minutesXP) * difficultyMultiplier);
  // }
}
