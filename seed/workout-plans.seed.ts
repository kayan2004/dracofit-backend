import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { WorkoutPlan, WorkoutPlanType } from '../src/workout_plans/entities/workout_plan.entity';
import { WorkoutExercise } from '../src/workout_exercises/entities/workout_exercise.entity';
import { Exercise } from '../src/exercises/entities/exercise.entity';
import { User } from '../src/users/entities/user.entity';
import { Logger, ValidationPipe } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import { parse } from 'csv-parse';
import { join } from 'path';

async function seedWorkoutPlans() {
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const workoutPlanRepo = dataSource.getRepository(WorkoutPlan);
    const workoutExerciseRepo = dataSource.getRepository(WorkoutExercise);
    const exerciseRepo = dataSource.getRepository(Exercise);
    const userRepo = dataSource.getRepository(User);

    console.log('Starting workout plans seed...');
    console.log('Available workout plan types:', Object.values(WorkoutPlanType));

    // Create or find admin user
    let adminUser = await userRepo.findOne({ 
      where: { email: 'admin@dracofit.com' } 
    });

    if (!adminUser) {
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash('adminpassword', salt);
      
      adminUser = userRepo.create({
        email: 'admin@dracofit.com',
        username: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        password: hashedPassword,
        isAdmin: true,
        isEmailVerified: true
      });
      adminUser = await userRepo.save(adminUser);
      console.log('Created admin user');
    }

    const parser = fs.createReadStream(join(__dirname, 'workout-plans.csv')).pipe(
      parse({
        columns: true,
        skip_empty_lines: true,
      }),
    );

    for await (const row of parser) {
      try {
        console.log('Processing row:', row);

        const existingPlan = await workoutPlanRepo.findOne({
          where: { name: row.name }
        });

        if (existingPlan) {
          console.log(`Workout plan "${row.name}" already exists, skipping...`);
          continue;
        }

        // Convert type to lowercase and ensure it matches enum
        const planType = row.type.toLowerCase();
        if (!Object.values(WorkoutPlanType).includes(planType)) {
          console.error(`Invalid workout plan type: ${row.type}`);
          continue;
        }

        const workoutPlan = workoutPlanRepo.create({
          name: row.name,
          description: row.description,
          type: planType as WorkoutPlanType,
          durationMinutes: parseInt(row.durationMinutes),
          user: adminUser
        });

        console.log('Creating workout plan:', {
          name: workoutPlan.name,
          type: workoutPlan.type
        });

        const savedPlan = await workoutPlanRepo.save(workoutPlan);
        console.log(`Created workout plan: ${row.name}`);

        // Process exercises
        const exercises = row.exercises.split(',');
        for (const exerciseData of exercises) {
          try {
            const [name, sets, reps, orderIndex, restTimeSeconds] = exerciseData.split(':');
            
            const exercise = await exerciseRepo.findOne({
              where: { name }
            });

            if (!exercise) {
              console.warn(`Exercise "${name}" not found, skipping...`);
              continue;
            }

            const workoutExercise = workoutExerciseRepo.create({
              workoutPlan: savedPlan,
              exercise: exercise,
              sets: parseInt(sets),
              reps: parseInt(reps),
              orderIndex: parseInt(orderIndex),
              restTimeSeconds: parseInt(restTimeSeconds)
            });

            await workoutExerciseRepo.save(workoutExercise);
            console.log(`Added exercise: ${name} to ${row.name}`);
          } catch (exerciseError) {
            console.error(`Error processing exercise:`, exerciseError.message);
          }
        }
      } catch (error) {
        console.error(`Error processing row:`, row);
        console.error('Error details:', error.response?.message || error.message);
      }
    }

    console.log('Workout plans seeding completed');
    await app.close();
  } catch (error) {
    console.error('Failed to seed workout plans:', error);
    process.exit(1);
  }
}

seedWorkoutPlans().catch((err) => {
  console.error('Error seeding workout plans:', err);
});