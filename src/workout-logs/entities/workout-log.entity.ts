import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { WorkoutPlan } from '../../workout_plans/entities/workout_plan.entity';
import { Exclude, Transform } from 'class-transformer';

export enum WorkoutStatus {
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
  PAUSED = 'paused',
}

@Entity('workout_logs')
export class WorkoutLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  @Index()
  user: User;

  @ManyToOne(() => WorkoutPlan, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'workout_plan_id' })
  @Transform(({ value }) => {
    if (!value) return null;
    // Return just the workout plan without any user details
    const { user, ...rest } = value;
    return rest;
  })
  workoutPlan: WorkoutPlan;

  @Column({ name: 'start_time', type: 'timestamp' })
  @Index()
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamp', nullable: true })
  endTime: Date;

  @Column({
    type: 'enum',
    enum: WorkoutStatus,
    default: WorkoutStatus.PAUSED,
  })
  @Index()
  status: WorkoutStatus;

  @Column({ name: 'xp_earned', default: 0 })
  xpEarned: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
