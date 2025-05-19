import {
  Injectable,
  NotFoundException,
  Logger,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull } from 'typeorm';
import { WorkoutLog } from './entities/workout-log.entity';
import { CreateWorkoutLogDto } from './dto/create-workout-log.dto';
import { UpdateWorkoutLogDto } from './dto/update-workout-log.dto';
import { WorkoutPlansService } from '../workout_plans/workout_plans.service';
import { StreaksService } from '../streaks/streaks.service';
import { UserPetsService } from '../user-pets/user-pets.service';

const BASE_XP_FOR_WORKOUT = 20;
const XP_PER_EXERCISE_COMPLETED = 5;

@Injectable()
export class WorkoutLogsService {
  private readonly logger = new Logger(WorkoutLogsService.name);

  constructor(
    @InjectRepository(WorkoutLog)
    private workoutLogRepository: Repository<WorkoutLog>,
    private readonly workoutPlansService: WorkoutPlansService,
    private readonly streaksService: StreaksService,
    private readonly userPetsService: UserPetsService,
  ) {}

  async create(
    createWorkoutLogDto: CreateWorkoutLogDto,
    userId: number,
  ): Promise<WorkoutLog> {
    const { workoutPlanId } = createWorkoutLogDto;
    this.logger.log(
      `Attempting to create workout log for plan ID: ${workoutPlanId}, user ID: ${userId}`,
    );

    // --- START: Check for existing completed log for this plan today ---
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const existingCompletedLogToday = await this.workoutLogRepository.findOne({
      where: {
        user: { id: userId },
        workoutPlan: { id: workoutPlanId },
        endTime: Between(todayStart, todayEnd), // Check for logs completed today
      },
    });

    if (existingCompletedLogToday) {
      this.logger.warn(
        `User ${userId} already completed workout plan ${workoutPlanId} today. Log ID: ${existingCompletedLogToday.id}`,
      );
      throw new ConflictException(
        `You have already logged a completed workout for this plan today.`,
      );
    }
    // --- END: Check for existing completed log ---

    // --- Optional: Check for any active (incomplete) log for this plan ---
    const existingActiveLog = await this.workoutLogRepository.findOne({
      where: {
        user: { id: userId },
        workoutPlan: { id: workoutPlanId },
        endTime: IsNull(), // <--- Change this from null to IsNull()
      },
    });

    if (existingActiveLog) {
      this.logger.warn(
        `User ${userId} has an active (incomplete) log for plan ${workoutPlanId}. Log ID: ${existingActiveLog.id}`,
      );
      // You might want to return this log or throw a different error
      // For now, let's prevent creating a new one if an active one exists.
      // Depending on your desired UX, you might want to allow resuming this log instead.
      throw new ConflictException(
        `You have an active (incomplete) session for this workout plan. Please complete or cancel it first.`,
      );
    }
    // --- END: Optional check for active log ---

    const workoutPlan = await this.workoutPlansService.findOne(
      workoutPlanId,
      userId,
    );
    if (!workoutPlan) {
      this.logger.warn(
        `Workout plan with ID: ${workoutPlanId} not found for user ID: ${userId}`,
      );
      throw new NotFoundException(
        `Workout plan with ID: ${workoutPlanId} not found`,
      );
    }

    const newWorkoutLog = this.workoutLogRepository.create({
      user: { id: userId },
      workoutPlan: { id: workoutPlanId },
      startTime: new Date(),
      // endTime will be set upon completion
      // xpEarned will be calculated upon completion
    });

    try {
      const savedLog = await this.workoutLogRepository.save(newWorkoutLog);
      this.logger.log(
        `Workout log created successfully with ID: ${savedLog.id} for user ID: ${userId}`,
      );
      return savedLog;
    } catch (error) {
      this.logger.error(
        `Failed to save new workout log for user ID: ${userId}, plan ID: ${workoutPlanId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to create workout log.');
    }
  }

  async findOne(id: number, userId: number): Promise<WorkoutLog> {
    const workoutLog = await this.workoutLogRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['workoutPlan', 'exerciseLogs', 'exerciseLogs.exercise'],
    });
    if (!workoutLog) {
      throw new NotFoundException(
        `Workout log with ID ${id} not found for user ${userId}`,
      );
    }
    return workoutLog;
  }

  async findAll(userId: number): Promise<WorkoutLog[]> {
    return this.workoutLogRepository.find({
      where: { user: { id: userId } },
      relations: ['workoutPlan'],
      order: { startTime: 'DESC' },
    });
  }

  async update(
    id: number,
    userId: number,
    updateWorkoutLogDto: UpdateWorkoutLogDto,
  ): Promise<WorkoutLog> {
    const workoutLog = await this.workoutLogRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['user', 'workoutPlan'], // Ensure workoutPlan is loaded if needed for XP calc
    });

    if (!workoutLog) {
      throw new NotFoundException(`Workout log with ID ${id} not found.`);
    }

    // Apply updates from DTO
    if (updateWorkoutLogDto.startTime !== undefined) {
      workoutLog.startTime = updateWorkoutLogDto.startTime;
    }
    if (updateWorkoutLogDto.endTime !== undefined) {
      workoutLog.endTime = updateWorkoutLogDto.endTime;
    }

    if (updateWorkoutLogDto.xpEarned !== undefined) {
      workoutLog.xpEarned = updateWorkoutLogDto.xpEarned;
    }

    // If duration is provided and endTime is set, calculate startTime
    if (
      updateWorkoutLogDto.durationMinutes &&
      workoutLog.endTime &&
      !workoutLog.startTime
    ) {
      const endTime = workoutLog.endTime;
      const startTime = new Date(
        endTime.getTime() - updateWorkoutLogDto.durationMinutes * 60000,
      );
      workoutLog.startTime = startTime;
      this.logger.log(
        `Calculated startTime: ${startTime.toISOString()} based on duration for log ID: ${id}`,
      );
    }

    // XP Calculation Logic
    const oldXpEarned = workoutLog.xpEarned; // Store old XP in case it was already set

    if (
      workoutLog.endTime &&
      workoutLog.startTime &&
      workoutLog.endTime > workoutLog.startTime &&
      (workoutLog.xpEarned === null ||
        workoutLog.xpEarned === 0 ||
        workoutLog.xpEarned === undefined) &&
      updateWorkoutLogDto.endTime !== undefined // Trigger XP calculation when endTime is being set
    ) {
      this.logger.log(`Calculating XP for workout log ID: ${id}`);
      if (!workoutLog.workoutPlan || !workoutLog.workoutPlan.id) {
        this.logger.warn(
          `WorkoutLog ID ${workoutLog.id} is missing workoutPlan relation or workoutPlan.id. Awarding base XP.`,
        );
        workoutLog.xpEarned = BASE_XP_FOR_WORKOUT;
      } else {
        // Ensure workoutPlan relation is loaded with exercises for accurate XP calculation
        const planWithExercises = await this.workoutPlansService.findOne(
          workoutLog.workoutPlan.id,
          userId, // Assuming findOne in workoutPlansService can take userId for auth/scoping
          true, // Load exercises
        );

        if (
          planWithExercises &&
          planWithExercises.workoutExercises &&
          planWithExercises.workoutExercises.length > 0
        ) {
          const numberOfExercises = planWithExercises.workoutExercises.length;
          workoutLog.xpEarned =
            BASE_XP_FOR_WORKOUT + numberOfExercises * XP_PER_EXERCISE_COMPLETED;
          this.logger.log(
            `Calculated XP: ${workoutLog.xpEarned} for log ID: ${id} based on ${numberOfExercises} exercises.`,
          );
        } else {
          this.logger.warn(
            `WorkoutPlan ID ${workoutLog.workoutPlan.id} has no exercises. Awarding base XP for log ID: ${id}.`,
          );
          workoutLog.xpEarned = BASE_XP_FOR_WORKOUT;
        }
      }
    } else if (updateWorkoutLogDto.xpEarned !== undefined) {
      // Allow manual override of xpEarned if provided in DTO
      workoutLog.xpEarned = updateWorkoutLogDto.xpEarned;
      this.logger.log(
        `XP for log ${id} was explicitly set via DTO to ${updateWorkoutLogDto.xpEarned}.`,
      );
    }

    try {
      const updatedLog = await this.workoutLogRepository.save(workoutLog);
      this.logger.log(
        `Workout log ID: ${id} updated successfully for user ID: ${userId}. XP Earned: ${updatedLog.xpEarned}`,
      );

      // If the workout is being marked as completed (i.e., endTime is set) AND XP was actually earned/changed
      if (
        updateWorkoutLogDto.endTime &&
        updatedLog.xpEarned > 0 &&
        updatedLog.xpEarned !== oldXpEarned
      ) {
        try {
          this.logger.log(
            `Workout completed for log ID: ${id}. Attempting to update streak and pet XP for user ID: ${userId}. XP to add: ${updatedLog.xpEarned}`,
          );
          await this.streaksService.recordWorkoutCompletion(userId);
          this.logger.log(
            `Streak updated successfully for user ID: ${userId} after completing workout log ID: ${id}.`,
          );

          // *** Add XP to user's pet ***
          await this.userPetsService.addXp(userId, updatedLog.xpEarned); // Assuming a method like addXpToPet exists
          this.logger.log(
            `Pet XP updated successfully for user ID: ${userId} with ${updatedLog.xpEarned} XP.`,
          );
        } catch (streakOrPetXpError) {
          this.logger.error(
            `Failed to update streak or pet XP for user ID: ${userId} after workout log ID: ${id}: ${streakOrPetXpError.message}`,
            streakOrPetXpError.stack,
          );
        }
      }
      return updatedLog;
    } catch (error) {
      this.logger.error(
        `Failed to save updated workout log ID: ${id} for user ID: ${userId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to update workout log.');
    }
  }

  async remove(id: number, userId: number): Promise<void> {
    this.logger.log(
      `Attempting to remove workout log ID: ${id} for user ID: ${userId}`,
    );
    const workoutLog = await this.findOne(id, userId); // Ensures ownership
    try {
      await this.workoutLogRepository.remove(workoutLog);
      this.logger.log(
        `Workout log ID: ${id} removed successfully for user ID: ${userId}.`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to remove workout log ID: ${id} for user ID: ${userId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to remove workout log.');
    }
  }

  async getLogsByDateRange(
    userId: number,
    startDate: Date,
    endDate: Date,
    workoutPlanId?: number,
  ): Promise<WorkoutLog[]> {
    this.logger.log(
      `Fetching logs for user ${userId} (completed between ${startDate.toISOString()} and ${endDate.toISOString()})${workoutPlanId ? `, plan ID: ${workoutPlanId}` : ''}`,
    );
    const queryOptions: any = {
      where: {
        user: { id: userId },
        endTime: Between(startDate, endDate), // <<< CRITICAL CHANGE: Query by endTime
      },
      relations: ['workoutPlan', 'exerciseLogs', 'exerciseLogs.exercise'],
      order: { endTime: 'DESC' }, // Optional: Consider ordering by endTime
    };

    if (workoutPlanId) {
      queryOptions.where.workoutPlan = { id: workoutPlanId };
    }

    try {
      const logs = await this.workoutLogRepository.find(queryOptions);
      this.logger.log(
        `Found ${logs.length} logs completed in the date range (queried by endTime).`,
      );
      return logs;
    } catch (error) {
      this.logger.error(
        `Error fetching logs by date range (queried by endTime): ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to fetch workout logs by date range.',
      );
    }
  }
}
