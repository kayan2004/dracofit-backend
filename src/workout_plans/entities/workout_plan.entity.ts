import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum WorkoutPlanType {
  STRENGTH = 'strength',
  CARDIO = 'cardio',
  HIIT = 'hiit',
  FLEXIBILITY = 'flexibility',
  HYBRID = 'hybrid',
}

@Entity('workout_plans')
export class WorkoutPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.workoutPlans)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  @Column({
    name: 'type',
    type: 'enum',
    enum: WorkoutPlanType,
    default: WorkoutPlanType.STRENGTH,
  })
  type: WorkoutPlanType;

  @Column({
    name: 'duration_minutes',
    type: 'integer',
    comment: 'Duration of workout in minutes',
  })
  durationMinutes: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
