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

@Injectable()
export class WorkoutPlansService {
  constructor(
    @InjectRepository(WorkoutPlan)
    private workoutPlansRepository: Repository<WorkoutPlan>,
  ) {}

  async create(
    createWorkoutPlanDto: CreateWorkoutPlanDto,
    user: User,
  ): Promise<WorkoutPlan> {
    const workoutPlan = this.workoutPlansRepository.create({
      ...createWorkoutPlanDto,
      user,
    });
    return await this.workoutPlansRepository.save(workoutPlan);
  }

  async findAll(): Promise<WorkoutPlan[]> {
    return await this.workoutPlansRepository.find({
      relations: ['user'],
    });
  }

  async findOne(id: number, userId: number): Promise<WorkoutPlan> {
    const workoutPlan = await this.workoutPlansRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!workoutPlan) {
      throw new NotFoundException(`Workout plan with ID ${id} not found`);
    }

    if (workoutPlan.user.id !== userId) {
      throw new ForbiddenException(
        'You can only access your own workout plans',
      );
    }

    return workoutPlan;
  }

  async update(
    id: number,
    updateWorkoutPlanDto: UpdateWorkoutPlanDto,
    userId: number,
  ): Promise<WorkoutPlan> {
    const workoutPlan = await this.findOne(id, userId);

    await this.workoutPlansRepository.update(id, updateWorkoutPlanDto);
    return this.findOne(id, userId);
  }

  async remove(id: number, userId: number): Promise<void> {
    const workoutPlan = await this.findOne(id, userId);

    const result = await this.workoutPlansRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Workout plan with ID ${id} not found`);
    }
  }

  async findByUser(userId: number): Promise<WorkoutPlan[]> {
    return await this.workoutPlansRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }
}
