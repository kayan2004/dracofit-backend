import { PartialType } from '@nestjs/mapped-types';
import { CreateFriendshipDto } from './create-friendship.dto';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { FriendshipStatus } from '../entities/friendship.entity';

export class UpdateFriendshipDto extends PartialType(CreateFriendshipDto) {
  @IsNotEmpty()
  @IsEnum(FriendshipStatus)
  status: FriendshipStatus;
}
