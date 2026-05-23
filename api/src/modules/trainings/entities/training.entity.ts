import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { TrainingStatus } from '../enums/training-status.enum';
import { AssignmentMode } from '../enums/assignment-mode.enum';
import { TrainingMaterial } from './training-material.entity';
import { TrainingAssignment } from './training-assignment.entity';
import { TrainingExclusion } from './training-exclusion.entity';

@Entity('trainings')
export class Training {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'datetime', name: 'starts_at', nullable: true })
  startsAt: Date | null;

  @Column({ type: 'datetime', name: 'ends_at', nullable: true })
  endsAt: Date | null;

  @Column({ type: 'boolean', name: 'is_mandatory', default: false })
  isMandatory: boolean;

  @Column({
    type: 'enum',
    enum: AssignmentMode,
    name: 'assignment_mode',
    default: AssignmentMode.ALL,
  })
  assignmentMode: AssignmentMode;

  @Column({ type: 'enum', enum: TrainingStatus, default: TrainingStatus.DRAFT })
  status: TrainingStatus;

  @OneToMany(() => TrainingMaterial, (material) => material.training, { cascade: true })
  materials: TrainingMaterial[];

  @OneToMany(() => TrainingAssignment, (assignment) => assignment.training, { cascade: true })
  assignments: TrainingAssignment[];

  @OneToMany(() => TrainingExclusion, (exclusion) => exclusion.training, { cascade: true })
  exclusions: TrainingExclusion[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
