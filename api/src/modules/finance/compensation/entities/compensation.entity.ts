import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Employee } from '../../../core/employees/entities/employee.entity';
import { CompensationFrequency } from '../enums/compensation-frequency.enum';
import { CompensationStatus } from '../enums/compensation-status.enum';
import { CompensationCondition } from '../enums/compensation-condition.enum';


@Entity('compensations')
export class Compensation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Employee, (employee) => employee.compensations)
    @Index()
    employee: Employee;

    @Column()
    employeeId: string;

    @Column()
    concept: string;

    @Column({ default: false })
    isLinkedGlobalParameter: boolean;

    @Column({
        type: 'enum',
        enum: CompensationCondition,
        default: CompensationCondition.NONE,
    })
    condition: CompensationCondition;

    @Column({ type: 'int', nullable: true })
    paymentDay: number;

    @Column({ type: 'int', nullable: true })
    secondPaymentDay: number;

    @Column({
        type: 'enum',
        enum: CompensationFrequency,
    })
    frequency: CompensationFrequency;

    @Column('decimal', { precision: 10, scale: 2, nullable: true })
    amount: number;

    @Column({
        nullable: true,
    })
    linkedGlobalParameter: string;

    @Column({ default: true })
    isActive: boolean;

    @Column({
        type: 'enum',
        enum: CompensationStatus,
        default: CompensationStatus.ACTIVE,
    })
    status: CompensationStatus;

    @Column('date')
    startDate: Date;

    @Column('date', { nullable: true })
    endDate: Date;

    @Column('date', { nullable: true })
    paymentDate: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
