import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatbotInteractionsService } from './chatbot-interactions.service';
import { ChatbotInteractionsController } from './chatbot-interactions.controller';
import { ChatbotInteraction } from './entities/chatbot-interaction.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([ChatbotInteraction]), UsersModule],
  controllers: [ChatbotInteractionsController],
  providers: [ChatbotInteractionsService],
  exports: [ChatbotInteractionsService],
})
export class ChatbotInteractionsModule {}
