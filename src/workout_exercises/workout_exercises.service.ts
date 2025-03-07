import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { CreateWorkoutExerciseDto } from './dto/create-workout_exercise.dto';
import { UpdateWorkoutExerciseDto } from './dto/update-workout_exercise.dto';
import { WorkoutExercise } from './entities/workout_exercise.entity';
import { WorkoutPlansService } from '../workout_plans/workout_plans.service';
import { ExercisesService } from '../exercises/exercises.service';

@Injectable()
export class WorkoutExercisesService {
  constructor(
    @InjectRepository(WorkoutExercise)
    private workoutExerciseRepository: Repository<WorkoutExercise>,
    private workoutPlansService: WorkoutPlansService,
    private exercisesService: ExercisesService,
  ) {}

  async create(
    workoutPlanId: number,
    userId: number,
    createWorkoutExerciseDto: CreateWorkoutExerciseDto,
  ) {
    // Verify workout plan exists and belongs to user
    const workoutPlan = await this.workoutPlansService.findOne(
      workoutPlanId,
      userId,
    );

    // Verify exercise exists
    const exercise = await this.exercisesService.findOne(
      createWorkoutExerciseDto.exerciseId,
    );

    // Check if order index is already taken
    const existingExercise = await this.workoutExerciseRepository.findOne({
      where: {
        workoutPlan: { id: workoutPlanId },
        orderIndex: createWorkoutExerciseDto.orderIndex,
      },
    });

    if (existingExercise) {
      throw new BadRequestException(
        'Order index already exists in this workout',
      );
    }

    const workoutExercise = this.workoutExerciseRepository.create({
      workoutPlan,
      exercise,
      sets: createWorkoutExerciseDto.sets,
      reps: createWorkoutExerciseDto.reps,
      orderIndex: createWorkoutExerciseDto.orderIndex,
      restTimeSeconds: createWorkoutExerciseDto.restTimeSeconds,
    });

    return this.workoutExerciseRepository.save(workoutExercise);
  }

  async findAll(workoutPlanId: number, userId: number) {
    // Verify workout plan belongs to user
    await this.workoutPlansService.findOne(workoutPlanId, userId);

    return this.workoutExerciseRepository.find({
      where: { workoutPlan: { id: workoutPlanId } },
      relations: ['exercise'],
      order: { orderIndex: 'ASC' },
    });
  }

  async findOne(workoutPlanId: number, exerciseId: number, userId: number) {
    // Verify workout plan belongs to user
    await this.workoutPlansService.findOne(workoutPlanId, userId);

    const workoutExercise = await this.workoutExerciseRepository.findOne({
      where: {
        workoutPlan: { id: workoutPlanId },
        id: exerciseId,
      },
      relations: ['exercise'],
    });

    if (!workoutExercise) {
      throw new NotFoundException('Workout exercise not found');
    }

    return workoutExercise;
  }

  async update(
    workoutPlanId: number,
    exerciseId: number,
    userId: number,
    updateWorkoutExerciseDto: UpdateWorkoutExerciseDto,
  ) {
    const workoutExercise = await this.findOne(
      workoutPlanId,
      exerciseId,
      userId,
    );

    // If order index is being updated, check for conflicts
    if (updateWorkoutExerciseDto.orderIndex) {
      const existingExercise = await this.workoutExerciseRepository.findOne({
        where: {
          workoutPlan: { id: workoutPlanId },
          orderIndex: updateWorkoutExerciseDto.orderIndex,
          id: Not(exerciseId),
        },
      });

      if (existingExercise) {
        throw new BadRequestException(
          'Order index already exists in this workout',
        );
      }
    }

    Object.assign(workoutExercise, updateWorkoutExerciseDto);
    return this.workoutExerciseRepository.save(workoutExercise);
  }

  async remove(workoutPlanId: number, exerciseId: number, userId: number) {
    const workoutExercise = await this.findOne(
      workoutPlanId,
      exerciseId,
      userId,
    );
    await this.workoutExerciseRepository.remove(workoutExercise);
  }

  async reorderExercises(
    workoutPlanId: number,
    userId: number,
    exerciseIds: number[],
  ) {
    await this.workoutPlansService.findOne(workoutPlanId, userId);

    await Promise.all(
      exerciseIds.map((exerciseId, index) =>
        this.workoutExerciseRepository.update(
          { id: exerciseId, workoutPlan: { id: workoutPlanId } },
          { orderIndex: index + 1 },
        ),
      ),
    );
  }
}
