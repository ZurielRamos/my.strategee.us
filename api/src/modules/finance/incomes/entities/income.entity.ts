import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import { Employee } from '@modules/core/employees/entities/employee.entity';
import { IncomeFrequency } from '../enums/income-frequency.enum';
import { IncomeType } from '../enums/income-type.enum';

import { ApiProperty } from '@nestjs/swagger';

@Entity('incomes')
export class Income {
    @ApiProperty({ description: 'The unique identifier of the income', format: 'uuid' })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Employee, { nullable: false })
    @JoinColumn({ name: 'employeeId' })
    employee: Employee;

    @ApiProperty({ description: 'The ID of the employee associated with this income' })
    @Column()
    employeeId: string;

    @ApiProperty({ description: 'The monetary amount of the income', type: 'number', format: 'decimal' })
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @ApiProperty({ description: 'A brief description of the income source (e.g., "Salary", "Bonus")' })
    @Column({ type: 'varchar', length: 255 })
    concept: string;

    @ApiProperty({ description: 'The frequency at which this income is paid', enum: IncomeFrequency, required: false })
    @Column({ type: 'enum', enum: IncomeFrequency, nullable: true })
    frequency: IncomeFrequency;

    @ApiProperty({ description: 'The type/category of the income', enum: IncomeType })
    @Column({ type: 'enum', enum: IncomeType })
    type: IncomeType;

    @ApiProperty({ description: 'Indicates whether the income record is currently active', default: true })
    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    // Polymorphic references to source modules
    @Column({ type: 'int', nullable: true })
    sourceContractId: number | null;

    @Column({ type: 'int', nullable: true })
    sourceBonusId: number | null;

    @Column({ type: 'int', nullable: true })
    sourceTicketId: number | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
