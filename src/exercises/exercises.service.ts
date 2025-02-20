import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { Exercise } from './entities/exercise.entity';

@Injectable()
export class ExercisesService {
  constructor(
    @InjectRepository(Exercise)
    private exercisesRepository: Repository<Exercise>,
  ) {}

  async create(CreateExerciseDto: CreateExerciseDto): Promise<Exercise> {
    const exercise = this.exercisesRepository.create(CreateExerciseDto);
    try {
      return await this.exercisesRepository.save(exercise);
    } catch (error) {
      if (error.name === 'QueryFailedError') {
        throw new ConflictException(
          `exercise with name ${CreateExerciseDto.name} already exists`,
        );
      }
      throw new InternalServerErrorException('Failed to create exercise');
    }
  }

  async findAll(): Promise<Exercise[]> {
    return await this.exercisesRepository.find();
  }

  async findOne(id: number): Promise<Exercise> {
    const exercise = await this.exercisesRepository.findOneBy({ id });
    if (!exercise) {
      throw new NotFoundException(`exercise with id ${id} not found`);
    }
    return exercise;
  }

  async update(
    id: number,
    UpdateExerciseDto: UpdateExerciseDto,
  ): Promise<Exercise> {
    await this.exercisesRepository.update(id, UpdateExerciseDto);
    const exercise = await this.exercisesRepository.findOneBy({ id });

    if (!exercise) {
      throw new NotFoundException(`exercise with id ${id} not found`);
    }
    return exercise;
  }

  async findByMuscleGroup(musclegroup: string): Promise<Exercise[]> {
    const exercises = await this.exercisesRepository.find({
      where: { musclegroup },
    });
    if (exercises.length === 0) {
      throw new NotFoundException(
        `No exercises found for muscle group ${musclegroup}`,
      );
    }
    return exercises;
  }

  async remove(id: number): Promise<void> {
    const result = await this.exercisesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`exercise with id ${id} not found`);
    }
  }
}
