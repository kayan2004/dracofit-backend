import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserDetailsService } from './user_details.service';
import { CreateUserDetailDto } from './dto/create-user_detail.dto';
import { UpdateUserDetailDto } from './dto/update-user_detail.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { Express } from 'express';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

@Controller('user-details')
@UseGuards(JwtAuthGuard)
export class UserDetailsController {
  constructor(private readonly userDetailsService: UserDetailsService) {}

  @Post('profile-picture')
  @UseInterceptors(FileInterceptor('profilePicture'))
  @HttpCode(HttpStatus.OK)
  async uploadProfilePicture(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }

    const userId = req.user.id;
    const fileUrl = `${BASE_URL}/uploads/profile-pics/${file.filename}`;

    console.log(`User ${userId} uploaded ${file.filename}. URL: ${fileUrl}`);

    const updatedUserDetails =
      await this.userDetailsService.updateProfilePicture(userId, fileUrl);

    return { profilePictureUrl: updatedUserDetails.profilePictureUrl };
  }

  @Post()
  create(@Request() req, @Body() createUserDetailDto: CreateUserDetailDto) {
    return this.userDetailsService.create(req.user.id, createUserDetailDto);
  }

  @Get()
  findOne(@Request() req) {
    return this.userDetailsService.findOne(req.user.id);
  }

  @Patch()
  update(@Request() req, @Body() updateUserDetailDto: UpdateUserDetailDto) {
    return this.userDetailsService.update(req.user.id, updateUserDetailDto);
  }

  @Delete()
  remove(@Request() req) {
    return this.userDetailsService.remove(req.user.id);
  }

  @UseGuards(AdminGuard)
  @Get('user/:userId')
  findOneByAdmin(@Param('userId', ParseIntPipe) userId: number) {
    return this.userDetailsService.findOne(userId);
  }
}
