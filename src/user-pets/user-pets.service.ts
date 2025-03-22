import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePetDto } from './dto/create-user-pet.dto';
import { Pet, PetAnimation, PetStage } from './entities/user-pet.entity';
import { UpdatePetDto } from './dto/update-user-pet.dto';

@Injectable()
export class UserPetsService {
  constructor(
    @InjectRepository(Pet)
    private petRepository: Repository<Pet>,
  ) {}

  /**
   * Create a new pet for a user
   */
  async create(userId: number, createPetDto: CreatePetDto): Promise<Pet> {
    // Check if user already has a pet
    const existingPet = await this.petRepository.findOne({
      where: { user: { id: userId } },
    });

    if (existingPet) {
      throw new ConflictException('User already has a pet');
    }

    const pet = this.petRepository.create({
      user: { id: userId },
      name: createPetDto.name,
      // Default values will be applied from the entity
    });

    return this.petRepository.save(pet);
  }

  /**
   * Find a user's pet
   */
  async findByUserId(userId: number): Promise<Pet> {
    const pet = await this.petRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    return pet;
  }

  /**
   * Update pet information
   */
  async update(userId: number, updatePetDto: UpdatePetDto): Promise<Pet> {
    const pet = await this.findByUserId(userId);

    // Update fields if provided
    if (updatePetDto.name !== undefined) {
      pet.name = updatePetDto.name;
    }

    if (updatePetDto.stage !== undefined) {
      pet.stage = updatePetDto.stage;
    }

    if (updatePetDto.currentAnimation !== undefined) {
      pet.currentAnimation = updatePetDto.currentAnimation;
    }

    if (updatePetDto.healthPoints !== undefined) {
      pet.healthPoints = updatePetDto.healthPoints;

      // Update animation based on health
      if (pet.healthPoints <= 0) {
        pet.currentAnimation = PetAnimation.DEAD;
      } else if (
        pet.currentAnimation === PetAnimation.DEAD &&
        pet.healthPoints > 0
      ) {
        pet.currentAnimation = PetAnimation.HAPPY;
        pet.resurrectionCount += 1;
      }
    }

    return this.petRepository.save(pet);
  }

  /**
   * Add XP to pet and handle leveling/evolution
   */
  async addXp(userId: number, xpAmount: number): Promise<Pet> {
    const pet = await this.findByUserId(userId);

    // Dead pets don't gain XP
    if (pet.currentAnimation === PetAnimation.DEAD) {
      return pet;
    }

    pet.xp += xpAmount;

    // Check for level up
    const xpThreshold = pet.level * 100; // Simple formula: 100 XP per level
    if (pet.xp >= xpThreshold) {
      pet.level += 1;
      pet.xp -= xpThreshold; // Carry over excess XP
      pet.currentAnimation = PetAnimation.HAPPY;

      // Check for evolution
      if (pet.level >= 10 && pet.stage !== PetStage.ADULT) {
        pet.stage = PetStage.ADULT;
      } else if (pet.level >= 5 && pet.stage === PetStage.BABY) {
        pet.stage = PetStage.TEEN;
      }
    }

    return this.petRepository.save(pet);
  }

  /**
   * Update pet streak and health based on workout consistency
   */
  async updateStreak(userId: number): Promise<Pet> {
    const pet = await this.findByUserId(userId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // If this is the first workout ever
    if (!pet.lastStreakDate) {
      pet.currentStreak = 1;
      pet.longestStreak = 1;
      pet.lastStreakDate = today;
      return this.petRepository.save(pet);
    }

    // Get date difference
    const lastDate = new Date(pet.lastStreakDate);
    lastDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round(
      (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) {
      // Already recorded for today
      return pet;
    } else if (diffDays === 1) {
      // Consecutive day
      pet.currentStreak++;
      pet.healthPoints = Math.min(100, pet.healthPoints + 10); // Gain health

      // Update longest streak if current is higher
      if (pet.currentStreak > pet.longestStreak) {
        pet.longestStreak = pet.currentStreak;
      }

      // Set happy animation if not dead
      if (pet.currentAnimation !== PetAnimation.DEAD) {
        pet.currentAnimation = PetAnimation.HAPPY;
      }
    } else {
      // Streak broken
      pet.currentStreak = 1;
      pet.healthPoints = Math.max(0, pet.healthPoints - 20); // Lose health

      if (pet.healthPoints <= 0) {
        pet.currentAnimation = PetAnimation.DEAD;
      } else {
        pet.currentAnimation = PetAnimation.SAD;
      }
    }

    pet.lastStreakDate = today;
    return this.petRepository.save(pet);
  }

  /**
   * Resurrect a dead pet
   */
  async resurrect(userId: number): Promise<Pet> {
    const pet = await this.findByUserId(userId);

    if (pet.currentAnimation !== PetAnimation.DEAD) {
      throw new ConflictException('Pet is not dead');
    }

    pet.healthPoints = 50; // Resurrect with half health
    pet.resurrectionCount += 1;
    pet.currentAnimation = PetAnimation.HAPPY;

    return this.petRepository.save(pet);
  }

  /**
   * Daily health decay (can be called by a scheduled task)
   */
  async dailyHealthDecay(userId: number): Promise<Pet> {
    const pet = await this.findByUserId(userId);

    // Skip if already dead
    if (pet.currentAnimation === PetAnimation.DEAD) {
      return pet;
    }

    // Health decay rate increases if streak is broken
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastDate = pet.lastStreakDate ? new Date(pet.lastStreakDate) : null;
    if (lastDate) {
      lastDate.setHours(0, 0, 0, 0);
      const diffDays = Math.round(
        (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Decay health faster the longer the streak is broken
      const decayAmount = Math.min(10, diffDays * 2);
      pet.healthPoints = Math.max(0, pet.healthPoints - decayAmount);

      if (pet.healthPoints <= 0) {
        pet.currentAnimation = PetAnimation.DEAD;
      } else if (pet.healthPoints < 30) {
        pet.currentAnimation = PetAnimation.SAD;
      }
    }

    return this.petRepository.save(pet);
  }
}
