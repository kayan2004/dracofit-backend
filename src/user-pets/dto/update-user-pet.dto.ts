import {
  IsString,
  IsOptional,
  IsEnum,
  MaxLength,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { PetStage, PetAnimation } from '../entities/user-pet.entity';

export class UpdatePetDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  name?: string;

  @IsEnum(PetStage)
  @IsOptional()
  stage?: PetStage;

  @IsEnum(PetAnimation)
  @IsOptional()
  currentAnimation?: PetAnimation;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  healthPoints?: number;
}
