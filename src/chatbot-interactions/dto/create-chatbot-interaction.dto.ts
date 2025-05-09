import { IsNotEmpty, IsString } from 'class-validator';

export class CreateChatbotInteractionDto {
  @IsNotEmpty()
  @IsString()
  question: string;

  @IsNotEmpty()
  @IsString()
  answer: string;
}
