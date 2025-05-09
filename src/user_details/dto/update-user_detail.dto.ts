import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDetailDto } from './create-user_detail.dto';
import { IsOptional, IsString, IsUrl } from 'class-validator'; // Import validators

export class UpdateUserDetailDto extends PartialType(CreateUserDetailDto) {
  // Add this field, make it optional for general updates
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Profile picture must be a valid URL' }) // Validate if provided
  profilePictureUrl?: string;
}
