import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WorkoutPlan } from '../../workout_plans/entities/workout_plan.entity';
import { Exercise } from '../../exercises/entities/exercise.entity';

@Entity('workout_exercises')
export class WorkoutExercise {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => WorkoutPlan, (workoutPlan) => workoutPlan.workoutExercises, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workout_plan_id' })
  workoutPlan: WorkoutPlan;

  @ManyToOne(() => Exercise, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'exercise_id' })
  exercise: Exercise;

  @Column()
  sets: number;

  @Column()
  reps: number;

  @Column({ nullable: true })
  duration: number;

  @Column({ name: 'order_index' })
  orderIndex: number;

  @Column({ name: 'rest_time_seconds', nullable: true })
  restTimeSeconds: number;
}
