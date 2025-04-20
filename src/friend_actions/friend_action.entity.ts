import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../users/entities/user.entity';

export enum FriendActionType {
  SENT = 'sent',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

@Entity('friend_actions')
export class FriendAction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.sentFriendRequests, { onDelete: 'CASCADE', nullable: false })
  @Index()
  user: User;

  @Column({
    type: 'enum',
    enum: FriendActionType,
  })
  @Index()
  action: FriendActionType;

  @CreateDateColumn()
  createdAt: Date;
}
