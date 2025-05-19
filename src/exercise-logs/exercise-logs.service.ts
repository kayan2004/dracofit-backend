import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExerciseLog } from './entities/exercise-log.entity';
import { CreateExerciseLogDto } from './dto/create-exercise-log.dto';
import { WorkoutLogsService } from '../workout-logs/workout-logs.service';
import { ExercisesService } from '../exercises/exercises.service';

@Injectable()
export class ExerciseLogsService {
  constructor(
    @InjectRepository(ExerciseLog)
    private exerciseLogRepository: Repository<ExerciseLog>,
    private workoutLogsService: WorkoutLogsService, // Used for verifying workout log ownership
    private exercisesService: ExercisesService, // Used for verifying exercise existence
  ) {}

  async create(
    workoutLogId: number,
    userId: number,
    createExerciseLogDto: CreateExerciseLogDto,
  ): Promise<ExerciseLog> {
    // Verify workout log belongs to this user
    const workoutLog = await this.workoutLogsService.findOne(
      workoutLogId,
      userId,
    );

    // Verify exercise exists
    const exercise = await this.exercisesService.findOne(
      createExerciseLogDto.exerciseId,
    );

    // Check if any set is a personal record
    const personalRecords = await this.getPersonalRecordsForExercise(
      userId,
      createExerciseLogDto.exerciseId,
    );

    // Mark personal records in sets data
    const setsData = createExerciseLogDto.setsData.map((set) => {
      // If this is a strength exercise with weight
      if (set.weight) {
        // Check if this set breaks the personal record
        const isPersonalRecord =
          !personalRecords.maxWeight || set.weight > personalRecords.maxWeight;
        return {
          ...set,
          isPersonalRecord,
        };
      }
      return set;
    });

    const exerciseLog = this.exerciseLogRepository.create({
      workoutLog,
      exercise,
      setsData,
    });

    return this.exerciseLogRepository.save(exerciseLog);
  }

  async findAll(workoutLogId: number, userId: number): Promise<ExerciseLog[]> {
    // Verify workout log belongs to this user
    await this.workoutLogsService.findOne(workoutLogId, userId);

    return this.exerciseLogRepository.find({
      where: { workoutLog: { id: workoutLogId } },
      relations: ['exercise'],
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(
    id: number,
    workoutLogId: number,
    userId: number,
  ): Promise<ExerciseLog> {
    // Verify workout log belongs to this user
    await this.workoutLogsService.findOne(workoutLogId, userId);

    const exerciseLog = await this.exerciseLogRepository.findOne({
      where: {
        id,
        workoutLog: { id: workoutLogId },
      },
      relations: ['exercise'],
    });

    if (!exerciseLog) {
      throw new NotFoundException(`Exercise log with ID ${id} not found`);
    }

    return exerciseLog;
  }

  async remove(
    id: number,
    workoutLogId: number,
    userId: number,
  ): Promise<void> {
    const exerciseLog = await this.findOne(id, workoutLogId, userId);
    await this.exerciseLogRepository.remove(exerciseLog);
  }

  async getPersonalRecords(userId: number): Promise<any[]> {
    const records = await this.exerciseLogRepository.query(
      `
      WITH exercise_sets AS (
        -- Extract all sets data first
        SELECT 
          e.id as exercise_id,
          e.name as exercise_name,
          (jsonb_array_elements(el.sets_data) ->> 'weight')::numeric as weight,
          (jsonb_array_elements(el.sets_data) ->> 'reps')::integer as reps
        FROM exercise_logs el
        JOIN exercises e ON el.exercise_id = e.id
        JOIN workout_logs wl ON el.workout_log_id = wl.id
        WHERE wl.user_id = $1
      ),
      -- Then find max weights
      max_weights AS (
        SELECT 
          exercise_id,
          exercise_name,
          MAX(weight) as max_weight
        FROM exercise_sets
        WHERE weight IS NOT NULL
        GROUP BY exercise_id, exercise_name
      ),
      -- Then find the reps at max weights
      max_weight_with_reps AS (
        SELECT 
          mw.exercise_id,
          mw.exercise_name,
          mw.max_weight,
          (
            SELECT reps 
            FROM exercise_sets es
            WHERE es.exercise_id = mw.exercise_id
              AND es.weight = mw.max_weight
            ORDER BY reps DESC
            LIMIT 1
          ) as reps_at_max_weight
        FROM max_weights mw
      )
      SELECT 
        exercise_id as "exerciseId",
        exercise_name as "exerciseName",
        max_weight as "maxWeight",
        reps_at_max_weight as "reps"
      FROM max_weight_with_reps
      ORDER BY max_weight DESC
    `,
      [userId],
    );

    return records;
  }

  private async getPersonalRecordsForExercise(
    userId: number,
    exerciseId: number,
  ): Promise<{ maxWeight?: number; maxReps?: number }> {
    const records = await this.exerciseLogRepository.query(
      `
      WITH exercise_sets AS (
        SELECT 
          (jsonb_array_elements(el.sets_data) ->> 'weight')::numeric as weight,
          (jsonb_array_elements(el.sets_data) ->> 'reps')::integer as reps
        FROM exercise_logs el
        JOIN workout_logs wl ON el.workout_log_id = wl.id
        WHERE wl.user_id = $1
          AND el.exercise_id = $2
      )
      SELECT 
        MAX(weight) as "maxWeight",
        MAX(reps) as "maxReps"
      FROM exercise_sets
      WHERE weight IS NOT NULL
      `,
      [userId, exerciseId],
    );

    if (records.length === 0 || !records[0].maxWeight) {
      return {};
    }
    return records[0];
  }

  // --- NEW METHOD ---
  async getExerciseHistory(
    userId: number,
    exerciseId: number,
  ): Promise<ExerciseLog[]> {
    // This query joins ExerciseLog with WorkoutLog to filter by userId
    // and with Exercise to filter by exerciseId.
    // It orders by the workout's start time to get a chronological history.
    return this.exerciseLogRepository
      .createQueryBuilder('exerciseLog')
      .innerJoinAndSelect('exerciseLog.workoutLog', 'workoutLog') // workoutLog contains user and startTime
      .innerJoinAndSelect('exerciseLog.exercise', 'exercise') // exercise contains exercise details like name
      .innerJoin('workoutLog.user', 'user') // Join to filter by user ID
      .where('user.id = :userId', { userId })
      .andWhere('exercise.id = :exerciseId', { exerciseId })
      .orderBy('workoutLog.startTime', 'ASC') // Order by date for chronological plotting
      .getMany();
  }
  // --- END NEW METHOD ---
}
