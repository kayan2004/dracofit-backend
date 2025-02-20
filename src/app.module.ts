import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { ExercisesModule } from './exercises/exercises.module';
import { Exercise } from './exercises/entities/exercise.entity';
import { AuthModule } from './auth/auth.module';
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost', // Change this to your database host
      port: 5432, // Change this to your database port
      username: 'postgres', // Change this to your database username
      password: 'root', // Change this to your database password
      database: 'dracofit', // Change this to your database name
      entities: [User, Exercise], // Add your entities here
      synchronize: true,
    }),
    UsersModule,
    ExercisesModule,
    AuthModule,
  ],
})
export class AppModule {}
