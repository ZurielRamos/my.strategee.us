import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Training } from './training.entity';
import { Attachment } from '@modules/infrastructure/attachments/entities/attachment.entity';
import { TrainingQuiz } from './quiz.entity';

@Entity('training_materials')
export class TrainingMaterial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36, name: 'training_id' })
  trainingId: string;

  @ManyToOne(() => Training, (training) => training.materials, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'training_id' })
  training: Training;

  @Column({ type: 'varchar', length: 36, name: 'attachment_id', nullable: true })
  attachmentId: string | null;

  @OneToOne(() => Attachment, { eager: true, onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'attachment_id' })
  attachment: Attachment;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'int', name: 'order_index', default: 0 })
  orderIndex: number;

  @OneToOne(() => TrainingQuiz, (quiz: TrainingQuiz) => quiz.material, { cascade: true, nullable: true })
  quiz: TrainingQuiz | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
