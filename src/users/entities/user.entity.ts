import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { WorkoutPlan } from '../../workout_plans/entities/workout_plan.entity';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  fullname: string;

  @Column({ unique: true })
  email: string;

  @Column()
  dob: Date;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: Gender,
  })
  gender: Gender;

  @Column()
  created_at: Date;

  @Column({ default: false })
  is_admin: boolean;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ type: 'varchar', nullable: true })
  verificationToken: string | null;

  @Column({ type: 'timestamp', nullable: true })
  verificationTokenExpires: Date | null;

  @Column({ type: 'varchar', nullable: true })
  resetPasswordToken: string | null;

  @Column({ type: 'timestamp', nullable: true })
  resetPasswordTokenExpires: Date | null;

  @OneToMany(() => WorkoutPlan, (workoutPlan) => workoutPlan.user)
  workoutPlans: WorkoutPlan[];
}
