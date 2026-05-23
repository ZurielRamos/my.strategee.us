import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { TrainingQuiz } from './quiz.entity';
import { QuizOption } from './quiz-option.entity';

@Entity('training_quiz_questions')
export class QuizQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'quiz_id', type: 'varchar', length: 36 })
  quizId: string;

  @ManyToOne(() => TrainingQuiz, (quiz) => quiz.questions, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'quiz_id' })
  quiz: TrainingQuiz;

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  score: number;

  @Column({ name: 'order_index', type: 'int' })
  orderIndex: number;

  @OneToMany(() => QuizOption, (option) => option.question, { eager: true })
  options: QuizOption[];
}
