import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum PetStage {
  BABY = 'baby',
  TEEN = 'teen',
  ADULT = 'adult',
}

export enum PetAnimation {
  IDLE = 'idle',
  HAPPY = 'happy',
  SAD = 'sad',
  DEAD = 'dead',
}

@Entity('user_pets')
export class Pet {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  @Index()
  user: User;

  @Column({ length: 50 })
  name: string;

  @Column({ default: 1 })
  level: number;

  @Column({ default: 0 })
  xp: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: PetStage.BABY,
  })
  stage: PetStage;

  @Column({
    name: 'current_animation',
    type: 'varchar',
    length: 20,
    default: PetAnimation.IDLE,
  })
  currentAnimation: PetAnimation;

  @Column({
    name: 'resurrection_count',
    default: 0,
  })
  resurrectionCount: number;

  @Column({
    name: 'is_dead',
    type: 'boolean',
    default: false,
  })
  isDead: boolean;

  @Column({
    name: 'health_points',
    default: 100,
  })
  healthPoints: number;

  @Column({
    name: 'current_streak',
    default: 0,
  })
  currentStreak: number;

  @Column({
    name: 'longest_streak',
    default: 0,
  })
  longestStreak: number;

  @Column({
    name: 'last_streak_date',
    type: 'timestamp',
    nullable: true,
  })
  lastStreakDate: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
