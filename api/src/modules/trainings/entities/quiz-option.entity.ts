import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { QuizQuestion } from './quiz-question.entity';

@Entity('training_quiz_options')
export class QuizOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'question_id', type: 'varchar', length: 36 })
  questionId: string;

  @ManyToOne(() => QuizQuestion, (question) => question.options, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'question_id' })
  question: QuizQuestion;

  @Column({ type: 'text' })
  text: string;

  @Column({ name: 'is_correct', type: 'boolean', default: false })
  isCorrect: boolean;

  @Column({ name: 'order_index', type: 'int' })
  orderIndex: number;
}
