import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateChatbotInteractionDto } from './dto/create-chatbot-interaction.dto';
import { UpdateChatbotInteractionDto } from './dto/update-chatbot-interaction.dto';
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
  ) {
    const user = await this.userRepository.findOneByOrFail({ id: userId });

    const interaction = this.chatbotInteractionRepository.create({
      user,
      question: createChatbotInteractionDto.question,
      answer: 'AI Response Here', // Replace with actual AI integration
    });

    return this.chatbotInteractionRepository.save(interaction);
  }

  findAll() {
    return this.chatbotInteractionRepository.find({
      relations: ['user'],
    });
  }

  async findOne(id: string) {
    const interaction = await this.chatbotInteractionRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!interaction) {
      throw new NotFoundException(`Interaction #${id} not found`);
    }

    return interaction;
  }

  async remove(id: string) {
    const interaction = await this.findOne(id);
    return this.chatbotInteractionRepository.remove(interaction);
  }
}
