import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Training } from './training.entity';
import { Employee } from '@modules/core/employees/entities/employee.entity';
import { AssignmentStatus } from '../enums/assignment-status.enum';
import { TrainingMaterialProgress } from './training-material-progress.entity';

@Entity('training_assignments')
@Unique(['trainingId', 'employeeId'])
export class TrainingAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'training_id', type: 'varchar', length: 36 })
  trainingId: string;

  @ManyToOne(() => Training, (training) => training.assignments)
  @JoinColumn({ name: 'training_id' })
  training: Training;

  @Column({ name: 'employee_id', type: 'varchar', length: 36 })
  employeeId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ type: 'enum', enum: AssignmentStatus, default: AssignmentStatus.PENDING })
  status: AssignmentStatus;

  @Column({ name: 'completed_at', type: 'datetime', nullable: true })
  completedAt: Date | null;

  @OneToMany(() => TrainingMaterialProgress, (progress) => progress.assignment)
  progress: TrainingMaterialProgress[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
