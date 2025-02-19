import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export enum Difficulty {
  beginner = 'Beginner',
  intermidiate = 'Intermidiate',
  advanced = 'Advanced',
}
@Entity()
export class Exercise {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column()
  description: string;

  @Column()
  type: string;

  @Column({
    type: 'enum',
    enum: Difficulty,
  })
  difficulty: Difficulty;

  @Column()
  equipment: string;

  @Column({ nullable: false })
  musclegroup: string;

  @Column()
  gif: string;
}
