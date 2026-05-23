import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Training } from './training.entity';
import { Employee } from '@modules/core/employees/entities/employee.entity';

@Entity('training_exclusions')
@Unique(['trainingId', 'employeeId'])
export class TrainingExclusion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'training_id', type: 'varchar', length: 36 })
  trainingId: string;

  @ManyToOne(() => Training, (training) => training.exclusions)
  @JoinColumn({ name: 'training_id' })
  training: Training;

  @Column({ name: 'employee_id', type: 'varchar', length: 36 })
  employeeId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
