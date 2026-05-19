import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Employee } from '../../employees/entities/employee.entity';
import { ContractStatus } from '../enums/contract-status.enum';
import { ContractType } from '../enums/contract-type.enum';
import { PayrollGroup } from '../enums/payroll-group.enum';
import { Company } from '../../../organization/companies/entities/company.entity';
import { Memorandum } from './memorandum.entity';

@Entity('contracts')
export class Contract {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Employee, (employee) => employee.contracts)
    employee: Employee;

    @Column()
    employeeId: string;

    @ManyToOne(() => Company)
    company: Company;

    @Column()
    companyId: string;

    @Column({ nullable: true })
    contractNumber: string;

    @Column({
        type: 'enum',
        enum: ContractStatus,
        default: ContractStatus.ACTIVE,
    })
    status: ContractStatus;

    @Column({
        type: 'enum',
        enum: ContractType,
    })
    type: ContractType;

    @Column({
        type: 'enum',
        enum: PayrollGroup,
    })
    payrollGroup: PayrollGroup;

    @Column('date')
    startDate: Date;

    @Column({ type: 'date', nullable: true })
    endDate: Date;



    @OneToMany(() => Memorandum, (memorandum) => memorandum.contract)
    memorandums: Memorandum[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
