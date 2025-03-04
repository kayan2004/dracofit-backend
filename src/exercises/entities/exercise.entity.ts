import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export enum Difficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

@Entity('exercises')
export class Exercise {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'name',
    unique: true,
  })
  name: string;

  @Column({ name: 'description' })
  description: string;

  @Column({ name: 'type' })
  type: string;

  @Column({
    name: 'difficulty',
    type: 'enum',
    enum: Difficulty,
  })
  difficulty: Difficulty;

  @Column({ name: 'equipment' })
  equipment: string;

  @Column('text', {
    name: 'target_muscles',
    array: true,
  })
  targetMuscles: string[];

  @Column({ name: 'video_url', nullable: true })
  videoUrl: string;

  // @Column({
  //   name: 'created_at',
  //   type: 'timestamp',
  //   default: () => 'CURRENT_TIMESTAMP'
  // })
  // createdAt: Date;

  // @Column({
  //   name: 'updated_at',
  //   type: 'timestamp',
  //   default: () => 'CURRENT_TIMESTAMP',
  //   onUpdate: 'CURRENT_TIMESTAMP'
  // })
  // updatedAt: Date;
}
