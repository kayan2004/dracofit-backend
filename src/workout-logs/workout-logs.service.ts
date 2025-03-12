import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkoutLog, WorkoutStatus } from './entities/workout-log.entity';
import { CreateWorkoutLogDto } from './dto/create-workout-log.dto';
import { UpdateWorkoutLogDto } from './dto/update-workout-log.dto';
import { WorkoutPlansService } from '../workout_plans/workout_plans.service';

@Injectable()
export class WorkoutLogsService {
  constructor(
    @InjectRepository(WorkoutLog)
    private workoutLogRepository: Repository<WorkoutLog>,
    private workoutPlansService: WorkoutPlansService,
  ) {}

  async logWorkoutCompletion(
    userId: number,
    createWorkoutLogDto: CreateWorkoutLogDto,
  ): Promise<WorkoutLog> {
    // Get the workout plan
    const workoutPlan = await this.workoutPlansService.findOne(
      createWorkoutLogDto.workoutPlanId,
      userId,
    );

    // Calculate timestamps
    const now = new Date();
    const startTime = new Date(now);

    // If duration provided, calculate startTime based on duration
    if (createWorkoutLogDto.durationMinutes) {
      startTime.setMinutes(
        startTime.getMinutes() - createWorkoutLogDto.durationMinutes,
      );
    } else {
      // Default to workout plan duration if available
      startTime.setMinutes(
        startTime.getMinutes() - (workoutPlan.durationMinutes || 30),
      );
    }

    // Calculate XP based on duration (1XP per minute)
    const durationMinutes =
      createWorkoutLogDto.durationMinutes || workoutPlan.durationMinutes || 30;
    const xpEarned = Math.round(durationMinutes);

    // Create the workout log
    const workoutLog = this.workoutLogRepository.create({
      user: { id: userId },
      workoutPlan,
      startTime,
      endTime: now,
      status: createWorkoutLogDto.status || WorkoutStatus.COMPLETED,
      xpEarned,
    });

    return this.workoutLogRepository.save(workoutLog);
  }

  async findAll(userId: number, status?: WorkoutStatus): Promise<WorkoutLog[]> {
    const query = this.workoutLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.workoutPlan', 'workoutPlan')
      .where('log.user_id = :userId', { userId })
      .orderBy('log.created_at', 'DESC');

    if (status) {
      query.andWhere('log.status = :status', { status });
    }

    return query.getMany();
  }

  async findOne(id: number, userId: number): Promise<WorkoutLog> {
    const workoutLog = await this.workoutLogRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['workoutPlan'],
    });

    if (!workoutLog) {
      throw new NotFoundException(`Workout log with ID ${id} not found`);
    }

    return workoutLog;
  }

  async update(
    id: number,
    userId: number,
    updateWorkoutLogDto: UpdateWorkoutLogDto,
  ): Promise<WorkoutLog> {
    const workoutLog = await this.findOne(id, userId);

    // Handle duration update if present
    if (updateWorkoutLogDto.durationMinutes) {
      // Recalculate startTime based on new duration
      const startTime = new Date(workoutLog.endTime || new Date());
      startTime.setMinutes(
        startTime.getMinutes() - updateWorkoutLogDto.durationMinutes,
      );
      workoutLog.startTime = startTime;

      // Update XP based on new duration
      workoutLog.xpEarned = Math.round(updateWorkoutLogDto.durationMinutes);
    }

    // Update status if provided
    if (updateWorkoutLogDto.status) {
      workoutLog.status = updateWorkoutLogDto.status;
    }

    return this.workoutLogRepository.save(workoutLog);
  }

  async remove(id: number, userId: number): Promise<void> {
    const workoutLog = await this.findOne(id, userId);
    await this.workoutLogRepository.remove(workoutLog);
  }

  async getStats(userId: number): Promise<any> {
    // Get total workouts
    const totalWorkouts = await this.workoutLogRepository.count({
      where: {
        user: { id: userId },
        status: WorkoutStatus.COMPLETED,
      },
    });

    // Get total XP
    const xpResult = await this.workoutLogRepository
      .createQueryBuilder('log')
      .select('SUM(log.xp_earned)', 'totalXp')
      .where('log.user_id = :userId', { userId })
      .andWhere('log.status = :status', { status: WorkoutStatus.COMPLETED })
      .getRawOne();

    // Get total duration
    const durationResult = await this.workoutLogRepository
      .createQueryBuilder('log')
      .select(
        'SUM(EXTRACT(EPOCH FROM (log.end_time - log.start_time)) / 60)',
        'totalMinutes',
      )
      .where('log.user_id = :userId', { userId })
      .andWhere('log.status = :status', { status: WorkoutStatus.COMPLETED })
      .getRawOne();

    // Get streak (consecutive days with workouts)
    // This is a simplified version - a real streak calculation would be more complex
    const streak = await this.calculateStreak(userId);

    return {
      totalWorkouts,
      totalXp: parseInt(xpResult?.totalXp || '0'),
      totalMinutes: Math.round(parseFloat(durationResult?.totalMinutes || '0')),
      streak,
    };
  }

  private async calculateStreak(userId: number): Promise<number> {
    const logs = await this.workoutLogRepository
      .createQueryBuilder('log')
      .select('DATE(log.created_at)', 'workout_date')
      .where('log.user_id = :userId', { userId })
      .andWhere('log.status = :status', { status: WorkoutStatus.COMPLETED })
      .groupBy('DATE(log.created_at)')
      .orderBy('DATE(log.created_at)', 'DESC')
      .getRawMany();

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if user worked out today
    const todayFormatted = today.toISOString().split('T')[0];
    const hasWorkoutToday = logs.some(
      (log) => log.workout_date === todayFormatted,
    );

    if (!hasWorkoutToday) {
      // Check if user worked out yesterday to continue the streak
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayFormatted = yesterday.toISOString().split('T')[0];
      const hasWorkoutYesterday = logs.some(
        (log) => log.workout_date === yesterdayFormatted,
      );

      if (!hasWorkoutYesterday) {
        return 0; // Streak broken
      }
    }

    // Count consecutive days
    for (let i = 0; i < logs.length; i++) {
      const currentDate = new Date(logs[i].workout_date);

      if (i === 0) {
        streak = 1;
        continue;
      }

      const prevDate = new Date(logs[i - 1].workout_date);
      const dayDiff = Math.floor(
        (prevDate.getTime() - currentDate.getTime()) / (1000 * 3600 * 24),
      );

      if (dayDiff === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }
}
