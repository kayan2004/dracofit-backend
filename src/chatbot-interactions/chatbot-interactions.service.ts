import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateChatbotInteractionDto } from './dto/create-chatbot-interaction.dto';
import { ChatbotInteraction } from './entities/chatbot-interaction.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ChatbotInteractionsService {
  constructor(
    @InjectRepository(ChatbotInteraction)
    private chatbotInteractionRepository: Repository<ChatbotInteraction>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(
    createChatbotInteractionDto: CreateChatbotInteractionDto,
    userId: number,
  ): Promise<ChatbotInteraction> {
    const user = await this.userRepository.findOneByOrFail({ id: userId });
    const interaction = this.chatbotInteractionRepository.create({
      user,
      question: createChatbotInteractionDto.question,
      answer: createChatbotInteractionDto.answer,
    });
    return this.chatbotInteractionRepository.save(interaction);
  }

  async findHistoryByUserId(userId: number): Promise<ChatbotInteraction[]> {
    return this.chatbotInteractionRepository.find({
      where: { user: { id: userId } },
      order: { timestamp: 'ASC' },
    });
  }

  findAll(): Promise<ChatbotInteraction[]> {
    return this.chatbotInteractionRepository.find({
      relations: ['user'],
      order: { timestamp: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ChatbotInteraction> {
    const interaction = await this.chatbotInteractionRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!interaction) {
      throw new NotFoundException(`Interaction #${id} not found`);
    }
    return interaction;
  }

  async remove(id: string): Promise<void> {
    const interaction = await this.findOne(id);
    await this.chatbotInteractionRepository.remove(interaction);
  }
}
