import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Credential } from './credential.entity';
import { Employee } from '@modules/core/employees/entities/employee.entity';

@Entity('credential_visibility_employees')
export class CredentialVisibilityEmployee {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Credential, (credential) => credential.visibilityEmployees)
    @JoinColumn({ name: 'credential_id' })
    credential: Credential;

    @Column({ type: 'uuid' })
    credentialId: string;

    @ManyToOne(() => Employee)
    @JoinColumn({ name: 'employee_id' })
    employee: Employee;

    @Column({ type: 'uuid' })
    employeeId: string;
}
