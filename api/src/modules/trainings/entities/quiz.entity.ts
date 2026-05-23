import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { TrainingMaterial } from './training-material.entity';
import { QuizQuestion } from './quiz-question.entity';

@Entity('training_quizzes')
export class TrainingQuiz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'material_id', type: 'varchar', length: 36, unique: true })
  materialId: string;

  @OneToOne(() => TrainingMaterial, (material) => material.quiz, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'material_id' })
  material: TrainingMaterial;

  @Column({ name: 'passing_score', type: 'int' })
  passingScore: number;

  @OneToMany(() => QuizQuestion, (question) => question.quiz, { eager: true })
  questions: QuizQuestion[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
