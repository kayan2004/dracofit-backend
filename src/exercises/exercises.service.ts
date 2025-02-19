import { Injectable } from '@nestjs/common';
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
    return this.exercisesRepository.save(exercise);
  }

  async findAll(): Promise<Exercise[]> {
    return this.exercisesRepository.find();
  }

  async findOne(id: number): Promise<Exercise> {
    const exercise = await this.exercisesRepository.findOneBy({ id });
    if (!exercise) {
      throw new Error(`exercise with id ${id} not found`);
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
      throw new Error(`exercise with id ${id} not found`);
    }
    return exercise;
  }

  async remove(id: number): Promise<void> {
    await this.exercisesRepository.delete(id);
  }
}
