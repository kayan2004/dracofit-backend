import {
  Injectable,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { handleServiceError } from '../utils/error-handler';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      isEmailVerified: true, // Force email verification for admin-created users
    });

    try {
      return await this.usersRepository.save(user);
    } catch (error) {
      if (error.code === '23505') {
        if (error.detail.includes('username')) {
          throw new ConflictException('Username already exists');
        }
        if (error.detail.includes('email')) {
          throw new ConflictException('Email already exists');
        }
      }
      throw new InternalServerErrorException();
    }
  }

  async findAll(): Promise<User[]> {
    return handleServiceError(async () => {
      return await this.usersRepository.find();
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
    return handleServiceError(async () => {
      const result = await this.usersRepository.delete(id);
      if (result.affected === 0) {
        throw new BadRequestException(`User with id ${id} not found`);
      }
    });
  }
}
