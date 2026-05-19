import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { User } from '@modules/iam/users/entities/user.entity';
import { DocumentType } from '../enums/document-type.enum';
import { Gender } from '../enums/gender.enum';
import { Contract } from '../../contracts/entities/contract.entity';
import { Compensation } from '../../../finance/compensation/entities/compensation.entity';
import { BenefitAllocation } from '../../benefits/entities/benefit-allocation.entity';
import { Attachment } from '@modules/infrastructure/attachments/entities/attachment.entity';

@Entity('employees')
export class Employee {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 100 })
    firstName: string;

    @Column({ type: 'varchar', length: 100 })
    lastName: string;

    @Column({ type: 'varchar', length: 50, unique: true })
    documentNumber: string;

    @Column({ type: 'varchar', length: 100 })
    documentType: DocumentType;

    @Column({ type: 'date' })
    birthDate: Date;

    @Column({ type: 'int', default: 90 })
    idoLimit: number;

    @Column({ type: 'enum', enum: Gender, nullable: true })
    gender: Gender | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    address: string | null;

    @Column({ type: 'varchar', length: 20 })
    personalPhone: string;

    @Column({ type: 'varchar', length: 100, unique: true, nullable: false })
    personalEmail: string;

    @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
    corporateEmail: string | null;

    @Column({ type: 'varchar', length: 500, nullable: true })
    photoUrl: string | null;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @OneToOne(() => User, (user) => user.employee, { nullable: true })
    @JoinColumn()
    user: User | null;

    @OneToOne(() => Attachment, { nullable: true, eager: true })
    @JoinColumn()
    profilePhoto: Attachment | null;

    @OneToMany(() => Contract, (contract) => contract.employee)
    contracts: Contract[];

    @OneToMany(() => Compensation, (compensation) => compensation.employee)
    compensations: Compensation[];

    @OneToMany(() => BenefitAllocation, (benefitAllocation) => benefitAllocation.employee)
    benefitAllocations: BenefitAllocation[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
