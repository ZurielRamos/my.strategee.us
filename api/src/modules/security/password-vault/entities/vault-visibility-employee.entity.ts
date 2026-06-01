import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Vault } from './vault.entity';
import { Employee } from '@modules/core/employees/entities/employee.entity';

@Entity('vault_visibility_employees')
export class VaultVisibilityEmployee {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Vault, (vault) => vault.visibilityEmployees)
    @JoinColumn({ name: 'vault_id' })
    vault: Vault;

    @Column({ type: 'uuid' })
    vaultId: string;

    @ManyToOne(() => Employee)
    @JoinColumn({ name: 'employee_id' })
    employee: Employee;

    @Column({ type: 'uuid' })
    employeeId: string;
}
