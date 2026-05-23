import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { TrainingAssignment } from './training-assignment.entity';
import { TrainingMaterial } from './training-material.entity';

@Entity('training_material_progress')
@Unique(['assignmentId', 'materialId'])
export class TrainingMaterialProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'assignment_id', type: 'varchar', length: 36 })
  assignmentId: string;

  @ManyToOne(() => TrainingAssignment, (assignment) => assignment.progress)
  @JoinColumn({ name: 'assignment_id' })
  assignment: TrainingAssignment;

  @Column({ name: 'material_id', type: 'varchar', length: 36 })
  materialId: string;

  @ManyToOne(() => TrainingMaterial)
  @JoinColumn({ name: 'material_id' })
  material: TrainingMaterial;

  @Column({ name: 'is_completed', type: 'boolean', default: false })
  isCompleted: boolean;

  @Column({ name: 'quiz_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  quizScore: number | null;

  @Column({ name: 'quiz_passed', type: 'boolean', nullable: true })
  quizPassed: boolean | null;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ name: 'completed_at', type: 'datetime', nullable: true })
  completedAt: Date | null;
}
