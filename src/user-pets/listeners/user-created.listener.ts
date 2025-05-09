import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserCreatedEvent } from '../../users/events/user-created.event'; // Ensure this path is correct
import { UserPetsService } from '../user-pets.service';
import { CreatePetDto } from '../dto/create-user-pet.dto';

@Injectable()
export class UserCreatedPetListener {
  private readonly logger = new Logger(UserCreatedPetListener.name);

  constructor(private readonly userPetsService: UserPetsService) {
    this.logger.log(
      'UserCreatedPetListener initialized and constructor called.',
    ); // Log listener instantiation
  }

  @OnEvent('user.created') // Listen for the 'user.created' event
  async handleUserCreatedEvent(event: UserCreatedEvent) {
    this.logger.log(
      `LISTENER_RECEIVED_EVENT: Event 'user.created' received. Payload: ${JSON.stringify(event)}`,
    );

    if (!event || typeof event.userId !== 'number' || !event.username) {
      this.logger.error(
        `LISTENER_INVALID_PAYLOAD: Received invalid or incomplete event payload: ${JSON.stringify(event)}`,
      );
      return; // Stop processing if payload is invalid
    }

    const { userId, username } = event;
    this.logger.log(
      `LISTENER_PROCESSING: Processing event for userId: ${userId}, username: ${username}`,
    );

    try {
      const defaultPetName = `${username}'s Dragon`;
      const createPetDto: CreatePetDto = { name: defaultPetName };
      this.logger.log(
        `LISTENER_PREPARE_CREATE_PET: Attempting to create pet for userId: ${userId} with DTO: ${JSON.stringify(createPetDto)}`,
      );

      // Call the service to create the pet
      // Note: This operation is outside the original signup transaction.
      const createdPet = await this.userPetsService.create(
        userId,
        createPetDto,
      );

      this.logger.log(
        `LISTENER_PET_CREATED_SUCCESS: Default pet successfully created for userId: ${userId}. Pet details: ${JSON.stringify(createdPet)}`,
      );
    } catch (error) {
      this.logger.error(
        `LISTENER_PET_CREATION_FAILED: Failed to create pet for userId ${userId}. Error: ${error.message}`,
        error.stack, // Log the full stack trace for the error
      );
      // Depending on the error, you might want to re-throw or handle it further
      // For now, just logging.
    }
    this.logger.log(
      `LISTENER_PROCESSING_COMPLETE: Finished processing 'user.created' event for userId: ${userId}`,
    );
  }
}
