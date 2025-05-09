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
  Query,
} from '@nestjs/common';
import { FriendshipsService } from './friendships.service';
import { CreateFriendshipDto } from './dto/create-friendship.dto';
import { UpdateFriendshipDto } from './dto/update-friendship.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FriendshipFilter } from './dto/friendship-filter.dto';

@UseGuards(JwtAuthGuard)
@Controller('friendships')
export class FriendshipsController {
  constructor(private readonly friendshipsService: FriendshipsService) {}

  @Post()
  create(@Body() createFriendshipDto: CreateFriendshipDto, @Request() req) {
    return this.friendshipsService.create(createFriendshipDto, req.user.id);
  }

  @Post('add-friend')
  createFriendRequest(
    @Body() createFriendshipDto: CreateFriendshipDto,
    @Request() req,
  ) {
    return this.friendshipsService.create(createFriendshipDto, req.user.id);
  }

  @Get()
  getFriendships(
    @Query('status') status: FriendshipFilter = FriendshipFilter.ALL,
    @Request() req,
  ) {
    return this.friendshipsService.getFriendshipsByStatus(req.user.id, status);
  }

  // @Get('pending')
  // getPendingRequests(@Request() req) {
  //   return this.friendshipsService.getPendingRequests(req.user.id);
  // }

  // @Get('friends')
  // getFriends(@Request() req) {
  //   return this.friendshipsService.getFriends(req.user.id);
  // }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.friendshipsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFriendshipDto: UpdateFriendshipDto,
    @Request() req,
  ) {
    return this.friendshipsService.update(id, updateFriendshipDto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.friendshipsService.remove(id, req.user.id);
  }

  // @Post('log-action')
  // logFriendAction(@Body('action') action: string, @Request() req) {
  //   return this.friendshipsService.logFriendAction(req.user.id, action);
  // }

  // @Get('friend-actions')
  // getFriendActions(@Request() req) {
  //   return this.friendshipsService.getFriendActions(req.user.id);
  // }
}
