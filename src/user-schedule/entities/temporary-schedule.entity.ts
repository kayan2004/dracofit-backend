import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { WorkoutPlan } from '../../workout_plans/entities/workout_plan.entity';
// Use the existing WeekDay enum
import { WeekDay } from './user-schedule-entry.entity';

@Entity('temporary_schedules') // Keep table name consistent if already migrated, or choose new one
@Index(['user', 'weekStartDate']) // Index for efficient querying by user and week
export class TemporarySchedule {
  // Renamed class
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: number; // Explicit column for easier querying if needed

  @Column({ type: 'enum', enum: WeekDay, nullable: false }) // Use WeekDay enum
  originalDayOfWeek: WeekDay; // The day the workout WAS scheduled

  @ManyToOne(() => WorkoutPlan, { nullable: false, onDelete: 'CASCADE' })
  workoutPlan: WorkoutPlan;

  @Column()
  workoutPlanId: number; // Explicit column

  @Column({ type: 'enum', enum: WeekDay, nullable: false }) // Use WeekDay enum
  rescheduledToDayOfWeek: WeekDay; // The day the workout is moved TO

  @Column({ type: 'date', nullable: false }) // Store only the date part
  weekStartDate: Date; // Date of the Sunday/Monday of the applicable week

  @CreateDateColumn()
  createdAt: Date;
}
