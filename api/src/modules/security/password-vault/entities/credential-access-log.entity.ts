import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Credential } from './credential.entity';
import { Employee } from '@modules/core/employees/entities/employee.entity';

@Entity('credential_access_logs')
export class CredentialAccessLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Credential, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'credential_id' })
    credential: Credential;

    @Column({ type: 'uuid' })
    credentialId: string;

    @ManyToOne(() => Employee)
    @JoinColumn({ name: 'employee_id' })
    employee: Employee;

    @Column({ type: 'uuid' })
    employeeId: string;

    @CreateDateColumn()
    accessedAt: Date;
}
