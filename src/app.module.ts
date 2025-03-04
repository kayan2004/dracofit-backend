import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { ExercisesModule } from './exercises/exercises.module';
import { Exercise } from './exercises/entities/exercise.entity';
import { WorkoutPlan } from './workout_plans/entities/workout_plan.entity';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from './email/email.module';
import { WorkoutPlansModule } from './workout_plans/workout_plans.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // makes ConfigModule available throughout the app
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost', // Change this to your database host
      port: 5432, // Change this to your database port
      username: 'postgres', // Change this to your database username
      password: 'root', // Change this to your database password
      database: 'dracofit', // Change this to your database name
      entities: [User, Exercise, WorkoutPlan], // Add your entities here
      synchronize: true,
    }),
    EmailModule,
    UsersModule,
    ExercisesModule,
    AuthModule,
    WorkoutPlansModule,
  ],
})
export class AppModule {}
