import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDetailDto } from './dto/create-user_detail.dto';
import { UpdateUserDetailDto } from './dto/update-user_detail.dto';
import { UserDetail } from './entities/user_detail.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class UserDetailsService {
  constructor(
    @InjectRepository(UserDetail)
    private userDetailsRepository: Repository<UserDetail>,
    private usersService: UsersService,
  ) {}

  async create(userId: number, createUserDetailDto: CreateUserDetailDto) {
    const user = await this.usersService.findOne(userId);

    const existingDetails = await this.userDetailsRepository.findOne({
      where: { user: { id: userId } },
    });

    if (existingDetails) {
      throw new BadRequestException('User details already exist');
    }

    const userDetail = this.userDetailsRepository.create({
      ...createUserDetailDto,
      user,
    });

    return this.userDetailsRepository.save(userDetail);
  }

  async findOne(userId: number) {
    const userDetail = await this.userDetailsRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!userDetail) {
      throw new NotFoundException('User details not found');
    }

    return userDetail;
  }

  async update(userId: number, updateUserDetailDto: UpdateUserDetailDto) {
    const userDetail = await this.findOne(userId);

    Object.assign(userDetail, updateUserDetailDto);

    return this.userDetailsRepository.save(userDetail);
  }

  async remove(userId: number) {
    const userDetail = await this.findOne(userId);
    return this.userDetailsRepository.remove(userDetail);
  }
}
