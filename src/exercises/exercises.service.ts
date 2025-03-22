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
import { FilterExerciseDto } from './dto/filter-exercise.dto';
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

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    exercises: Exercise[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const [exercises, total] = await this.exercisesRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      exercises,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
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

  async findWithFilters(filters: FilterExerciseDto): Promise<{
    exercises: Exercise[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const queryBuilder =
      this.exercisesRepository.createQueryBuilder('exercise');

    // Add search functionality
    if (filters.searchTerm) {
      queryBuilder.andWhere(
        '(LOWER(exercise.name) LIKE LOWER(:searchTerm) OR LOWER(exercise.description) LIKE LOWER(:searchTerm))',
        {
          searchTerm: `%${filters.searchTerm}%`,
        },
      );
    }

    if (filters.difficulty) {
      queryBuilder.andWhere('exercise.difficulty = :difficulty', {
        difficulty: filters.difficulty,
      });
    }

    if (filters.targetMuscles && filters.targetMuscles.length > 0) {
      queryBuilder.andWhere(
        'exercise.targetMuscles && ARRAY[:...targetMuscles]',
        {
          targetMuscles: filters.targetMuscles,
        },
      );
    }

    if (filters.type) {
      queryBuilder.andWhere('LOWER(exercise.type) = LOWER(:type)', {
        type: filters.type,
      });
    }

    if (filters.equipment) {
      queryBuilder.andWhere('LOWER(exercise.equipment) = LOWER(:equipment)', {
        equipment: filters.equipment,
      });
    }

    // Add pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    // Add ordering for consistent results
    queryBuilder.orderBy('exercise.name', 'ASC');

    const [exercises, total] = await queryBuilder.getManyAndCount();

    // Remove the exception for empty results as it's valid to have no search matches
    // Instead, just return an empty array with the correct metadata
    return {
      exercises,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1, // Ensure at least 1 page even for empty results
    };
  }

  async remove(id: number): Promise<void> {
    const result = await this.exercisesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`exercise with id ${id} not found`);
    }
  }
}
