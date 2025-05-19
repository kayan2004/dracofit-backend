import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Request,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UserPetsService } from './user-pets.service';
import { CreatePetDto } from './dto/create-user-pet.dto';
import { UpdatePetDto } from './dto/update-user-pet.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Pet } from './entities/user-pet.entity'; // Ensure this import is correct

@Controller('user-pets')
@UseGuards(JwtAuthGuard)
export class UserPetsController {
  constructor(private readonly userPetsService: UserPetsService) {}

  @Post('restart-journey') // This defines the POST route for /user-pets/restart-journey
  async restartJourney(@Req() req): Promise<Pet> {
    // Ensure Pet is the correct return type
    // Assuming your JWT strategy adds a 'user' object to the request
    // And that user object has an 'id' property
    const userId = req.user.id;
    if (!userId) {
      throw new Error(
        'User ID not found in request. Ensure JWT Auth is working correctly.',
      );
    }
    return this.userPetsService.handlePetRestart(userId);
  }

  @Post()
  create(@Request() req, @Body() createPetDto: CreatePetDto) {
    return this.userPetsService.create(req.user.id, createPetDto);
  }

  @Get()
  findOne(@Request() req) {
    return this.userPetsService.findByUserId(req.user.id);
  }

  @Patch()
  update(@Request() req, @Body() updatePetDto: UpdatePetDto) {
    return this.userPetsService.update(req.user.id, updatePetDto);
  }

  @Post('add-xp')
  addXp(@Request() req, @Body() body: { xpAmount: number }) {
    return this.userPetsService.addXp(req.user.id, body.xpAmount);
  }

  @Post('update-streak')
  updateStreak(@Request() req) {
    return this.userPetsService.updateStreak(req.user.id);
  }

  @Post('resurrect')
  resurrect(@Request() req) {
    return this.userPetsService.resurrect(req.user.id);
  }
}
