import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { WorkoutLog } from '../../workout-logs/entities/workout-log.entity';
import { Exercise } from '../../exercises/entities/exercise.entity';

@Entity('exercise_logs')
export class ExerciseLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => WorkoutLog, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workout_log_id' })
  @Index()
  workoutLog: WorkoutLog;

  @ManyToOne(() => Exercise, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'exercise_id' })
  exercise: Exercise;

  @Column({ name: 'sets_data', type: 'jsonb' })
  setsData: SetData[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

// Type definition for the sets data
export interface SetData {
  setNumber: number;
  reps: number;
  weight?: number;
  isPersonalRecord?: boolean;
}
