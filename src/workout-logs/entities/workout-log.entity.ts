import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany, // Import OneToMany
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn, // Import UpdateDateColumn
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { WorkoutPlan } from '../../workout_plans/entities/workout_plan.entity';
import { ExerciseLog } from '../../exercise-logs/entities/exercise-log.entity'; // Import ExerciseLog
import { Transform } from 'class-transformer';

@Entity('workout_logs')
export class WorkoutLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' }) // Inverse side (user.workoutLogs) is not specified to avoid TS error if User entity is not changed
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

  @Column({ name: 'xp_earned', default: 0 })
  xpEarned: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' }) // Added updatedAt field
  updatedAt: Date;

  // Add this relationship for ExerciseLogs
  @OneToMany(() => ExerciseLog, (exerciseLog) => exerciseLog.workoutLog, {
    cascade: true,
  })
  exerciseLogs: ExerciseLog[];

  // Add a virtual getter for duration
  get durationMinutes(): number {
    if (!this.startTime || !this.endTime) return 0;
    const durationMs = this.endTime.getTime() - this.startTime.getTime();
    return Math.round(durationMs / (1000 * 60)); // Convert ms to minutes
  }
}
