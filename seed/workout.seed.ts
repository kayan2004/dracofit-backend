import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { WorkoutPlan, WorkoutPlanType } from '../src/workout_plans/entities/workout_plan.entity';
import { WorkoutExercise } from '../src/workout_exercises/entities/workout_exercise.entity';
import { Exercise } from '../src/exercises/entities/exercise.entity';
import { User } from '../src/users/entities/user.entity';

const DEFAULT_WORKOUTS = [
    {
      name: 'Full Body Strength',
      description: 'A comprehensive full-body workout focusing on major muscle groups',
      type: WorkoutPlanType.STRENGTH,
      durationMinutes: 45,
      exercises: [
        {
          name: 'Barbell Bench Press - Medium Grip',
          sets: 3,
          reps: 12,
          restTimeSeconds: 60,
          orderIndex: 1
        },
        {
          name: 'Barbell Squat',
          sets: 3,
          reps: 10,
          restTimeSeconds: 90,
          orderIndex: 2
        },
        {
          name: 'Pull-Ups - Close Grip',
          sets: 3,
          reps: 8,
          restTimeSeconds: 60,
          orderIndex: 3
        }
      ]
    },
    {
      name: 'HIIT Cardio',
      description: 'High-intensity interval training for maximum calorie burn',
      type: WorkoutPlanType.HIIT,
      durationMinutes: 30,
      exercises: [
        {
          name: 'Burpee',
          sets: 4,
          reps: 15,
          restTimeSeconds: 30,
          orderIndex: 1
        },
        {
          name: 'Mountain Climber',
          sets: 4,
          reps: 30,
          restTimeSeconds: 30,
          orderIndex: 2
        }
      ]
    },
    {
      name: 'Flexibility Flow',
      description: 'Improve flexibility and mobility with this stretching routine',
      type: WorkoutPlanType.FLEXIBILITY,
      durationMinutes: 40,
      exercises: [
        {
          name: "World's Greatest Stretch",
          sets: 2,
          reps: 10,
          restTimeSeconds: 30,
          orderIndex: 1
        },
        {
          name: 'Cross-body Shoulder Stretch',
          sets: 2,
          reps: 8,
          restTimeSeconds: 30,
          orderIndex: 2
        }
      ]
    },
    {
      name: 'Core Power',
      description: 'Build a strong core with these targeted exercises',
      type: WorkoutPlanType.STRENGTH,
      durationMinutes: 35,
      exercises: [
        {
          name: 'Elbow Plank',
          sets: 3,
          reps: 0,
          duration: 60,
          restTimeSeconds: 45,
          orderIndex: 1
        },
        {
          name: 'Russian Twists',
          sets: 3,
          reps: 20,
          restTimeSeconds: 45,
          orderIndex: 2
        }
      ]
    },
    {
      name: 'Endurance Builder',
      description: 'Improve your cardiovascular endurance',
      type: WorkoutPlanType.CARDIO,
      durationMinutes: 50,
      exercises: [
        {
          name: 'Treadmill Running',
          sets: 1,
          reps: 0,
          duration: 1200,
          restTimeSeconds: 60,
          orderIndex: 1
        },
        {
          name: 'Jump Rope',
          sets: 3,
          reps: 50,
          restTimeSeconds: 45,
          orderIndex: 2
        }
      ]
    }
  ];
  
export async function createDefaultWorkoutsForUser(userId: number, dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  
  try {
    // Get repositories
    const userRepository = dataSource.getRepository(User);
    const exerciseRepository = dataSource.getRepository(Exercise);
    
    // Find the user
    const user = await userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    console.log(`Creating default workouts for user ${user.username} (ID: ${userId})`);
    
    for (const defaultWorkout of DEFAULT_WORKOUTS) {
      // Create workout plan
      const workoutPlan = new WorkoutPlan();
      workoutPlan.name = defaultWorkout.name;
      workoutPlan.description = defaultWorkout.description;
      workoutPlan.type = defaultWorkout.type;
      workoutPlan.durationMinutes = defaultWorkout.durationMinutes;
      workoutPlan.user = user;
      workoutPlan.isPublic = false;
      workoutPlan.status = 'ACTIVE';
      
      const savedWorkoutPlan = await queryRunner.manager.save(workoutPlan);
      console.log(`Created workout plan: ${savedWorkoutPlan.name}`);
      
      for (const exerciseData of defaultWorkout.exercises) {
        // Try exact match first
        let exercise = await exerciseRepository.findOne({
          where: { name: exerciseData.name }
        });
        
        // If not found, try partial match
        if (!exercise) {
          console.log(`Exercise not found by exact name: ${exerciseData.name}, trying partial match...`);
          const exercises = await exerciseRepository
            .createQueryBuilder('exercise')
            .where('LOWER(exercise.name) LIKE LOWER(:name)', { name: `%${exerciseData.name}%` })
            .getMany();
            
          if (exercises.length > 0) {
            exercise = exercises[0];
            console.log(`Found similar exercise: ${exercise.name} (ID: ${exercise.id})`);
          }
        }
        
        if (!exercise) {
          console.warn(`Exercise not found: ${exerciseData.name}`);
          continue;
        }
        
        // Insert directly into workout_exercises table using SQL
        await queryRunner.manager.query(
          `INSERT INTO workout_exercises 
          (workout_plan_id, exercise_id, sets, reps, rest_time_seconds, order_index) 
          VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            savedWorkoutPlan.id,
            exercise.id,
            exerciseData.sets,
            exerciseData.reps || 0, // Always provide reps, use 0 if not specified
            exerciseData.restTimeSeconds,
            exerciseData.orderIndex
          ]
        );
        
        console.log(`  - Added exercise ${exercise.name} to workout`);
      }
    }
    
    await queryRunner.commitTransaction();
    console.log(`✅ Successfully created all workouts for user ${userId}`);
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Error creating default workouts:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}

async function seedDefaultWorkouts() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    console.log('Starting default workouts seeding...');
    await dataSource.query('SELECT 1');
    
    const userRepository = dataSource.getRepository(User);
    const users = await userRepository.find();
    console.log(`Found ${users.length} users`);
    
    // First, check if we have exercises
    const exerciseCount = await dataSource.getRepository(Exercise).count();
    console.log(`Found ${exerciseCount} exercises in database`);
    
    if (exerciseCount === 0) {
      console.log('No exercises found. Please run seed:exercises first.');
      return;
    }

    for (const user of users) {
      const existingWorkouts = await dataSource
        .getRepository(WorkoutPlan)
        .count({ where: { user: { id: user.id } } });

      console.log(`User ${user.id}: ${existingWorkouts} existing workouts`);
      
      if (existingWorkouts === 0) {
        console.log(`Creating default workouts for user ${user.id}`);
        await createDefaultWorkoutsForUser(user.id, dataSource);
      }
    }

    console.log('Default workouts seeding completed successfully');
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Run seed if called directly
if (require.main === module) {
  seedDefaultWorkouts()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Seed failed:', error);
      process.exit(1);
    });
}