import {
  Injectable,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, ILike, Not } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { handleServiceError } from '../utils/error-handler';
import { createDefaultWorkoutsForUser } from '../../seed/workout.seed';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

      const user = this.usersRepository.create({
        ...createUserDto,
        password: hashedPassword,
        isEmailVerified: true,
      });

      // Save the user first
      const savedUser = await queryRunner.manager.save(user);
      console.log('User saved:', savedUser);

      // Check if exercises exist in the database
      const exerciseCount = await queryRunner.manager.query(
        'SELECT COUNT(*) FROM exercises',
      );
      const count = parseInt(exerciseCount[0].count);
      console.log('Exercise count:', count);

      if (count > 0) {
        // Create default workouts for the new user
        await createDefaultWorkoutsForUser(savedUser.id, this.dataSource);
        console.log('Default workouts created for user:', savedUser.id);
      } else {
        console.log('No exercises found. Skipping workout creation.');
      }

      await queryRunner.commitTransaction();
      return savedUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error during user creation:', error);

      if (error.code === '23505') {
        if (error.detail.includes('username')) {
          throw new ConflictException('Username already exists');
        }
        if (error.detail.includes('email')) {
          throw new ConflictException('Email already exists');
        }
      }
      throw new InternalServerErrorException(
        'Error creating user with default workouts',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<User[]> {
    return handleServiceError(async () => {
      return await this.usersRepository.find();
    });
  }
  async searchUsers(query: string, currentUserId: number): Promise<User[]> {
    if (!query || query.trim().length < 2) {
      // Avoid overly broad searches or searching for empty strings
      return [];
    }

    return handleServiceError(async () => {
      const results = await this.usersRepository.find({
        where: [
          // Find where username is like the query AND id is not the current user
          { username: ILike(`%${query}%`), id: Not(currentUserId) },
          // OR find where email is like the query AND id is not the current user
          { email: ILike(`%${query}%`), id: Not(currentUserId) },
        ],
        select: ['id', 'username', 'email', 'firstName', 'lastName'], // Select only necessary fields
        take: 10, // Limit the number of results
      });
      return results;
    });
  }

  async findOne(id: number): Promise<User> {
    return handleServiceError(async () => {
      const user = await this.usersRepository.findOneBy({ id });
      if (!user) {
        throw new BadRequestException(`User with id ${id} not found`);
      }
      return user;
    });
  }

  async findByUsername(username: string): Promise<User> {
    return handleServiceError(async () => {
      const user = await this.usersRepository.findOne({ where: { username } });
      if (!user) {
        throw new BadRequestException(
          `User with username ${username} not found`,
        );
      }
      return user;
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    return handleServiceError(async () => {
      await this.usersRepository.update(id, updateUserDto);
      const user = await this.usersRepository.findOneBy({ id });
      if (!user) {
        throw new BadRequestException(`User with id ${id} not found`);
      }
      return user;
    });
  }

  async remove(id: number): Promise<void> {
    try {
      const result = await this.usersRepository.delete(id);
      console.log('Delete result:', result);

      if (result.affected === 0) {
        throw new BadRequestException(`User with id ${id} not found`);
      }

      return;
    } catch (error) {
      console.error('Error deleting user:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An error occurred while deleting the user',
      );
    }
  }
}
