import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkoutLog } from './entities/workout-log.entity';
import { CreateWorkoutLogDto } from './dto/create-workout-log.dto';
import { UpdateWorkoutLogDto } from './dto/update-workout-log.dto';
import { WorkoutPlansService } from '../workout_plans/workout_plans.service';

@Injectable()
export class WorkoutLogsService {
  constructor(
    @InjectRepository(WorkoutLog)
    private workoutLogRepository: Repository<WorkoutLog>,
    private readonly workoutPlansService: WorkoutPlansService,
  ) {}

  /**
   * Create a new workout log (called when starting a workout)
   */
  async create(userId: number, createWorkoutLogDto: CreateWorkoutLogDto) {
    // Get the workout plan to associate
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

    // Create the workout log with startTime and endTime set to now
    const workoutLog = this.workoutLogRepository.create({
      user: { id: userId },
      workoutPlan,
      startTime: now,
      endTime: now,
      // xpEarned: 0, // Temporarily removed
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
      relations: ['workoutPlan'],
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
    const workoutLog = await this.findOne(id, userId);

    // let xpNeedsRecalculation = false; // Temporarily removed

    if (updateWorkoutLogDto.durationMinutes !== undefined) {
      const endTime = updateWorkoutLogDto.endTime
        ? new Date(updateWorkoutLogDto.endTime)
        : workoutLog.endTime;

      const startTime = new Date(endTime);
      startTime.setMinutes(
        startTime.getMinutes() - updateWorkoutLogDto.durationMinutes,
      );

      workoutLog.startTime = startTime;
      if (updateWorkoutLogDto.endTime) {
        workoutLog.endTime = new Date(updateWorkoutLogDto.endTime);
      } else {
        workoutLog.endTime = new Date();
      }
      // xpNeedsRecalculation = true; // Temporarily removed
    } else {
      if (updateWorkoutLogDto.startTime !== undefined) {
        workoutLog.startTime = new Date(updateWorkoutLogDto.startTime);
        // xpNeedsRecalculation = true; // Temporarily removed
      }
      if (updateWorkoutLogDto.endTime !== undefined) {
        workoutLog.endTime = new Date(updateWorkoutLogDto.endTime);
        // xpNeedsRecalculation = true; // Temporarily removed
      }
    }

    // Temporarily removed XP calculation logic
    // if (xpNeedsRecalculation && workoutLog.workoutPlan) {
    //   const calculatedDuration = workoutLog.durationMinutes;
    //   workoutLog.xpEarned = this.calculateXP(
    //     calculatedDuration,
    //     workoutLog.workoutPlan,
    //   );
    // } else if (updateWorkoutLogDto.xpEarned !== undefined) {
    //   workoutLog.xpEarned = updateWorkoutLogDto.xpEarned;
    // }

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
