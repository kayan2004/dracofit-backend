import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { WorkoutPlan } from '../../workout_plans/entities/workout_plan.entity';
import { UserTokens } from '../../user-tokens/entities/user-token.entity';
import { Friendship } from '../../friendships/entities/friendship.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, name: 'username' })
  username: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ unique: true, name: 'email' })
  email: string;

  @Column({ name: 'password' })
  password: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ default: false, name: 'is_admin' })
  isAdmin: boolean;

  @Column({ default: false, name: 'is_email_verified' })
  isEmailVerified: boolean;

  @OneToMany(() => WorkoutPlan, (workoutPlan) => workoutPlan.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  workoutPlans: WorkoutPlan[];

  @OneToMany(() => UserTokens, (token) => token.user)
  tokens: UserTokens[];

  @OneToMany(() => Friendship, (friendship) => friendship.user1)
  sentFriendRequests: Friendship[];

  @OneToMany(() => Friendship, (friendship) => friendship.user2)
  receivedFriendRequests: Friendship[];
}
