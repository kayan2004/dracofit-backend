import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Patch,
  Query, // Import Query
  Request, // Import Request
  ParseIntPipe, // Import ParseIntPipe if needed later
  Res, // Import Res for response manipulation
  HttpStatus, // Import HttpStatus
} from '@nestjs/common';
import { Response } from 'express';
import * as jdenticon from 'jdenticon';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator'; // Import Public decorator
import { AdminGuard } from '../auth/admin.guard'; // Keep for admin-only routes
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
@Controller('users')
// Apply JwtAuthGuard globally for this controller, but AdminGuard only where needed
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public() // <-- Mark this specific route as public
  @Get(':userId/avatar')
  async getUserAvatar(
    @Param('userId', ParseIntPipe) userId: number,
    @Res() res: Response, // Inject Response object
  ) {
    try {
      // Generate SVG using user ID as the value. Size can be adjusted.
      const svgString = jdenticon.toSvg(userId.toString(), 200); // Generate 200x200 SVG

      // Set headers and send SVG response
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable'); // Cache for a week
      res.status(HttpStatus.OK).send(svgString);
    } catch (error) {
      console.error(`Error generating avatar for user ${userId}:`, error);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send('Error generating avatar');
    }
  }
  // --- ADD SEARCH ENDPOINT ---
  @Get('search') // No AdminGuard here - regular users can search
  async search(
    @Query('query') query: string,
    @Request() req, // Get request object to access the user attached by JwtAuthGuard
  ): Promise<User[]> {
    const currentUserId = req.user.id; // Assuming JWT payload has 'id'
    return this.usersService.searchUsers(query, currentUserId);
  }
  // --- END SEARCH ENDPOINT ---

  // --- Admin Only Routes ---
  @UseGuards(AdminGuard) // Apply AdminGuard specifically here
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(AdminGuard) // Apply AdminGuard specifically here
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(AdminGuard) // Apply AdminGuard specifically here
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    // Use ParseIntPipe
    return this.usersService.findOne(id);
  }

  // This might be admin-only or allow users to find others? Adjust guard as needed.
  // For now, assume admin only.
  @UseGuards(AdminGuard)
  @Get('username/:username')
  async findByUsername(@Param('username') username: string): Promise<User> {
    return this.usersService.findByUsername(username);
  }

  // This could be admin updating any user, or a user updating their own profile.
  // Needs more specific logic/guards if users can update themselves.
  // Assume admin only for now.
  @UseGuards(AdminGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number, // Use ParseIntPipe
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @UseGuards(AdminGuard) // Apply AdminGuard specifically here
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    // Use ParseIntPipe
    return this.usersService.remove(id);
  }
}
