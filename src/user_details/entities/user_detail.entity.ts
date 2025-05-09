import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

export enum FitnessLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export enum FitnessGoal {
  WEIGHT_LOSS = 'weight_loss',
  MUSCLE_GAIN = 'muscle_gain',
  MAINTAIN = 'maintain',
  IMPROVE_STRENGTH = 'improve_strength',
  IMPROVE_ENDURANCE = 'improve_endurance',
}

@Entity('user_details')
export class UserDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: Gender })
  gender: Gender;

  @Column({ type: 'date' })
  birthdate: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  weight: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  height: number;

  @Column({
    type: 'enum',
    enum: FitnessLevel,
    default: FitnessLevel.BEGINNER,
  })
  fitness_level: FitnessLevel;

  @Column({
    type: 'enum',
    enum: FitnessGoal,
    default: FitnessGoal.MAINTAIN,
  })
  fitness_goal: FitnessGoal;

  @Column({ type: 'integer', default: 3 })
  workout_days_per_week: number;

  @Column({ type: 'text', array: true, default: '{}' })
  preferred_workout_types: string[];

  @Column({ type: 'varchar', length: 2048, nullable: true }) // Use varchar, allow null, generous length for URL
  profilePictureUrl: string | null;
}
