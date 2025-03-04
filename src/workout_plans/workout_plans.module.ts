import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkoutPlansService } from './workout_plans.service';
import { WorkoutPlansController } from './workout_plans.controller';
import { WorkoutPlan } from './entities/workout_plan.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([WorkoutPlan]), UsersModule],
  controllers: [WorkoutPlansController],
  providers: [WorkoutPlansService],
  exports: [WorkoutPlansService],
})
export class WorkoutPlansModule {}
