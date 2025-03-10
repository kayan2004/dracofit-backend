import { PartialType } from '@nestjs/mapped-types';
import { CreateChatbotInteractionDto } from './create-chatbot-interaction.dto';

export class UpdateChatbotInteractionDto extends PartialType(CreateChatbotInteractionDto) {}
