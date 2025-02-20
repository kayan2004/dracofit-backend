import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    return handleServiceError(async () => {
      const user = this.usersRepository.create(createUserDto);
      return await this.usersRepository.save(user);
    });
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
