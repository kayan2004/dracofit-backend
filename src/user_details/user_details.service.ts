import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDetailDto } from './dto/create-user_detail.dto';
import { UpdateUserDetailDto } from './dto/update-user_detail.dto';
import { UserDetail } from './entities/user_detail.entity';
import { UsersService } from '../users/users.service';
import { handleServiceError } from '../utils/error-handler';

// --- UPDATE BASE_URL DEFINITION ---
// Ensure this matches your actual API base path, including '/api' if used
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000/api';
// --- END UPDATE BASE_URL DEFINITION ---

@Injectable()
export class UserDetailsService {
  constructor(
    @InjectRepository(UserDetail)
    private userDetailsRepository: Repository<UserDetail>,
    private usersService: UsersService,
  ) {}

  async create(userId: number, createUserDetailDto: CreateUserDetailDto) {
    return handleServiceError(async () => {
      const user = await this.usersService.findOne(userId);
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found.`);
      }

      const existingDetails = await this.userDetailsRepository.findOne({
        where: { user: { id: userId } },
      });
      if (existingDetails) {
        throw new BadRequestException(
          `User details already exist for user ID ${userId}. Use PATCH to update.`,
        );
      }

      // --- SET DEFAULT DYNAMIC AVATAR URL ---
      // This will now correctly include /api
      const defaultAvatarUrl = `${BASE_URL}/users/${userId}/avatar`;
      // --- END SET DEFAULT DYNAMIC AVATAR URL ---

      const newUserDetail = this.userDetailsRepository.create({
        ...createUserDetailDto,
        user: user,
        profilePictureUrl: defaultAvatarUrl,
      });

      return this.userDetailsRepository.save(newUserDetail);
    });
  }

  async findOne(userId: number): Promise<UserDetail> {
    return handleServiceError(async () => {
      const userDetail = await this.userDetailsRepository.findOne({
        where: { user: { id: userId } },
        relations: ['user'],
      });

      if (!userDetail) {
        throw new NotFoundException(
          `User details not found for user ID ${userId}`,
        );
      }
      return userDetail;
    });
  }

  async update(userId: number, updateUserDetailDto: UpdateUserDetailDto) {
    return handleServiceError(async () => {
      const { profilePictureUrl, ...restDto } = updateUserDetailDto;

      const userDetail = await this.findOne(userId);

      Object.assign(userDetail, restDto);

      return this.userDetailsRepository.save(userDetail);
    });
  }

  async updateProfilePicture(
    userId: number,
    profilePictureUrl: string,
  ): Promise<UserDetail> {
    return handleServiceError(async () => {
      const userDetail = await this.findOne(userId);

      userDetail.profilePictureUrl = profilePictureUrl;

      try {
        return await this.userDetailsRepository.save(userDetail);
      } catch (error) {
        console.error('Error saving profile picture URL:', error);
        throw new InternalServerErrorException(
          'Failed to update profile picture.',
        );
      }
    });
  }

  async remove(userId: number): Promise<void> {
    return handleServiceError(async () => {
      const userDetail = await this.findOne(userId);
      await this.userDetailsRepository.remove(userDetail);
    });
  }
}
