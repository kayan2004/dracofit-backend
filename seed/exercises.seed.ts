import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import {
  Exercise,
  Difficulty,
} from '../src/exercises/entities/exercise.entity';
import { CreateExerciseDto } from '../src/exercises/dto/create-exercise.dto';
import { ValidationPipe } from '@nestjs/common';
import * as fs from 'fs';
import { parse } from 'csv-parse';
import { join } from 'path';

async function seedExercises() {
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const exerciseRepository = dataSource.getRepository(Exercise);
    const validationPipe = new ValidationPipe({
      transform: true,
      validateCustomDecorators: true,
      enableDebugMessages: true, // Add debug messages
    });

    const parser = fs.createReadStream(join(__dirname, 'exercises.csv')).pipe(
      parse({
        columns: true,
        skip_empty_lines: true,
      }),
    );

    for await (const row of parser) {
      try {
        console.log('Processing row:', row); // Debug log

        const exerciseDto = new CreateExerciseDto();
        exerciseDto.name = row.name;
        exerciseDto.description = row.description;
        exerciseDto.type = row.type;
        exerciseDto.difficulty = row.difficulty?.toLowerCase() as Difficulty;
        exerciseDto.equipment = row.equipment;
        // Ensure targetMuscles is always an array
        exerciseDto.targetMuscles = row.target_muscles
          ? row.target_muscles.split(',').map((m) => m.trim())
          : [];
        exerciseDto.videoUrl = row.video_url || ''; // Provide default if missing

        console.log('Created DTO:', exerciseDto); // Debug log

        try {
          await validationPipe.transform(exerciseDto, {
            type: 'body',
            metatype: CreateExerciseDto,
          });
        } catch (validationError) {
          console.error(
            'Validation failed:',
            validationError.response?.message,
          );
          continue;
        }

        const existingExercise = await exerciseRepository.findOne({
          where: { name: exerciseDto.name },
        });

        if (existingExercise) {
          console.log(
            `Exercise ${exerciseDto.name} already exists, skipping...`,
          );
          continue;
        }

        const exercise = exerciseRepository.create(exerciseDto);
        await exerciseRepository.save(exercise);
        console.log(`Successfully added exercise: ${exercise.name}`);
      } catch (error) {
        console.error(`Error processing row:`, row);
        console.error(
          'Error details:',
          error.response?.message || error.message,
        );
      }
    }

    console.log('Exercise seeding completed');
    await app.close();
  } catch (error) {
    console.error('Failed to seed exercises:', error);
    process.exit(1);
  }
}

seedExercises().catch((err) => {
  console.error('Error seeding exercises:', err);
});
