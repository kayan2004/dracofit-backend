import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserSchedule } from './user-schedule.entity';
import { WorkoutPlan } from '../../workout_plans/entities/workout_plan.entity';

export enum WeekDay {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
}

@Entity('user_schedule_entries')
export class UserScheduleEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'schedule_id' })
  scheduleId: number;

  @ManyToOne(() => UserSchedule, (schedule) => schedule.entries, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'schedule_id' })
  schedule: UserSchedule;

  @Column({
    name: 'day_of_week',
    type: 'enum',
    enum: WeekDay,
  })
  @Index()
  dayOfWeek: WeekDay;

  @Column({ name: 'workout_plan_id', nullable: true })
  workoutPlanId: number | null;

  @ManyToOne(() => WorkoutPlan, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'workout_plan_id' })
  workoutPlan: WorkoutPlan | null;

  @Column({ name: 'preferred_time', type: 'time', nullable: true })
  preferredTime: string | null;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string | null;
}
