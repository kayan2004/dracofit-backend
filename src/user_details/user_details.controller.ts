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
} from '@nestjs/common';
import { UserDetailsService } from './user_details.service';
import { CreateUserDetailDto } from './dto/create-user_detail.dto';
import { UpdateUserDetailDto } from './dto/update-user_detail.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('user-details')
@UseGuards(JwtAuthGuard)
export class UserDetailsController {
  constructor(private readonly userDetailsService: UserDetailsService) {}

  @Post()
  create(@Request() req, @Body() createUserDetailDto: CreateUserDetailDto) {
    console.log('User object from request:', req.user);
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

  // Admin routes
  @UseGuards(AdminGuard)
  @Get('user/:userId')
  findOneByAdmin(@Param('userId', ParseIntPipe) userId: number) {
    return this.userDetailsService.findOne(userId);
  }
}
