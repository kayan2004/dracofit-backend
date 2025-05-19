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
import { UserDetailsModule } from './user_details/user_details.module';
import { UserDetail } from './user_details/entities/user_detail.entity';
import { WorkoutExercisesModule } from './workout_exercises/workout_exercises.module';
import { WorkoutExercise } from './workout_exercises/entities/workout_exercise.entity';
import { UserTokens } from './user-tokens/entities/user-token.entity';
import { UserTokensModule } from './user-tokens/user-tokens.module';
import { FriendshipsModule } from './friendships/friendships.module';
import { Friendship } from './friendships/entities/friendship.entity';
import { ChatbotInteractionsModule } from './chatbot-interactions/chatbot-interactions.module';
import { ChatbotInteraction } from './chatbot-interactions/entities/chatbot-interaction.entity';
import { WorkoutLogsModule } from './workout-logs/workout-logs.module';
import { WorkoutLog } from './workout-logs/entities/workout-log.entity';
import { ExerciseLogsModule } from './exercise-logs/exercise-logs.module';
import { ExerciseLog } from './exercise-logs/entities/exercise-log.entity';
import { UserPetsModule } from './user-pets/user-pets.module';
import { Pet } from './user-pets/entities/user-pet.entity';
import { StreaksModule } from './streaks/streaks.module';
import { DebugModule } from './debug/debug.module'; // Import the DebugModule
// Import the schedule models
import { UserSchedule } from './user-schedule/entities/user-schedule.entity';
import { UserScheduleEntry } from './user-schedule/entities/user-schedule-entry.entity';
// Import the schedule module
import { UserScheduleModule } from './user-schedule/user-schedule.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TemporarySchedule } from './user-schedule/entities/temporary-schedule.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksModule } from './tasks/tasks.module';
import { TimeModule } from './common/time.module'; // Adjust path if you place it elsewhere
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
      entities: [
        User,
        WorkoutPlan,
        WorkoutExercise, // Make sure this is included
        Exercise,
        UserDetail,
        UserTokens,
        Friendship,
        ChatbotInteraction,
        WorkoutLog,
        ExerciseLog,
        Pet,
        UserSchedule, // Add the UserSchedule entity
        UserScheduleEntry, // Add the UserScheduleEntry entity
        TemporarySchedule,
      ], // Add your entities here
      synchronize: true,
    }),
    EmailModule,
    UsersModule,
    ExercisesModule,
    AuthModule,
    WorkoutPlansModule,
    UserDetailsModule,
    WorkoutExercisesModule,
    UserTokensModule,
    FriendshipsModule,
    ChatbotInteractionsModule,
    WorkoutLogsModule,
    ExerciseLogsModule,
    UserPetsModule,
    UserScheduleModule,
    StreaksModule,
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(), // Ensures cron jobs can run
    TasksModule,
    TimeModule, // Add TimeModule
    DebugModule,
  ],
})
export class AppModule {}
