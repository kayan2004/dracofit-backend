import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { ChatbotInteractionsService } from './chatbot-interactions.service';
import { CreateChatbotInteractionDto } from './dto/create-chatbot-interaction.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('chatbot-interactions')
export class ChatbotInteractionsController {
  constructor(
    private readonly chatbotInteractionsService: ChatbotInteractionsService,
  ) {}

  @Post()
  create(
    @Body() createChatbotInteractionDto: CreateChatbotInteractionDto,
    @Request() req,
  ) {
    return this.chatbotInteractionsService.create(
      createChatbotInteractionDto,
      req.user.id,
    );
  }

  @Get('/history')
  findUserHistory(@Request() req) {
    const userId = req.user.id;
    return this.chatbotInteractionsService.findHistoryByUserId(userId);
  }

  @Get()
  findAll() {
    return this.chatbotInteractionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chatbotInteractionsService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.chatbotInteractionsService.remove(id);
  }
}
