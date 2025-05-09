import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateWorkoutPlanDto } from './dto/create-workout_plan.dto';
import { UpdateWorkoutPlanDto } from './dto/update-workout_plan.dto';
import { WorkoutPlan } from './entities/workout_plan.entity';
import { User } from '../users/entities/user.entity';
import { WorkoutExercise } from '../workout_exercises/entities/workout_exercise.entity';

@Injectable()
export class WorkoutPlansService {
  constructor(
    @InjectRepository(WorkoutPlan)
    private workoutPlanRepository: Repository<WorkoutPlan>,
  ) {}

  async create(
    createWorkoutPlanDto: CreateWorkoutPlanDto,
    user: User,
  ): Promise<WorkoutPlan> {
    const workoutPlan = this.workoutPlanRepository.create({
      ...createWorkoutPlanDto,
      user,
    });
    return await this.workoutPlanRepository.save(workoutPlan);
  }

  async findAll(): Promise<WorkoutPlan[]> {
    return await this.workoutPlanRepository.find({
      relations: ['user'],
    });
  }

  async findOne(
    // Return type remains WorkoutPlan | undefined
    id: number,
    userId: number,
    loadExercises: boolean = false,
  ): Promise<WorkoutPlan> {
    // Assuming it throws if not found, so return type is WorkoutPlan
    const relationsToLoad = ['user'];
    if (loadExercises) {
      relationsToLoad.push('workoutExercises'); // Changed 'exercises' to 'workoutExercises'
    }
    const plan = await this.workoutPlanRepository.findOne({
      where: { id, user: { id: userId } },
      relations: relationsToLoad,
    });
    if (!plan) {
      throw new NotFoundException(
        `Workout plan with ID ${id} not found for user ${userId}`,
      );
    }
    return plan;
  }

  async update(
    id: number,
    updateWorkoutPlanDto: UpdateWorkoutPlanDto,
    userId: number,
  ): Promise<WorkoutPlan> {
    const workoutPlan = await this.findOne(id, userId);
    if (!workoutPlan) {
      // This would be redundant if findOne always throws, but satisfies TypeScript
      throw new NotFoundException(
        `Workout plan with ID ${id} not found for user ${userId}`,
      );
    }
    // ... rest of update logic ...
    await this.workoutPlanRepository.update(
      { id, user: { id: userId } },
      updateWorkoutPlanDto,
    );
    const updatedPlan = await this.findOne(id, userId, true);
    if (!updatedPlan) {
      // Should not happen if update was successful
      throw new NotFoundException(
        `Updated workout plan with ID ${id} not found for user ${userId}`,
      );
    }
    return updatedPlan;
  }

  async remove(id: number, userId: number): Promise<void> {
    const workoutPlan = await this.findOne(id, userId);
    if (!workoutPlan) {
      // Redundant if findOne throws
      throw new NotFoundException(
        `Workout plan with ID ${id} not found for user ${userId}`,
      );
    }
    // ... rest of remove logic ...
  }

  async findByUser(userId: number): Promise<WorkoutPlan[]> {
    return await this.workoutPlanRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }
}
