import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { UserScheduleEntry } from './user-schedule-entry.entity';

@Entity('user_schedule')
export class UserSchedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', unique: true })
  userId: number;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'name', length: 100, default: 'My Weekly Schedule' })
  name: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => UserScheduleEntry, (entry) => entry.schedule, {
    cascade: true,
    eager: true, // Always load entries with schedule
  })
  entries: UserScheduleEntry[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
