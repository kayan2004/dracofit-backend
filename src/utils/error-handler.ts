import {
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';

export async function handleServiceError<T>(
  serviceMethod: () => Promise<T>,
): Promise<T> {
  try {
    return await serviceMethod();
  } catch (error) {
    if (error instanceof BadRequestException) {
      throw error;
    }
    throw new InternalServerErrorException('An unexpected error occurred');
  }
}
