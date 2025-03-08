import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateFriendshipDto {
  @IsNotEmpty()
  @IsNumber()
  friendId: number;
}
