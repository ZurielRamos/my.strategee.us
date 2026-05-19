import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    JoinColumn,
} from 'typeorm';
import { Employee } from './employee.entity';

@Entity('employee_settings')
export class EmployeeSettings {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => Employee, { onDelete: 'CASCADE' })
    @JoinColumn()
    employee: Employee;

    @Column({ type: 'uuid' })
    employeeId: string;

    @Column({ type: 'boolean', default: false })
    personalEmailNotification: boolean;

    @Column({ type: 'boolean', default: false })
    corporativeEmailNotification: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
