import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { Employee } from '@modules/core/employees/entities/employee.entity';
import { Credential } from './credential.entity';
import { VisibilityLevel } from '../enums/visibility-level.enum';
import { VaultVisibilityCompany } from './vault-visibility-company.entity';
import { VaultVisibilityArea } from './vault-visibility-area.entity';
import { VaultVisibilityPosition } from './vault-visibility-position.entity';
import { VaultVisibilityEmployee } from './vault-visibility-employee.entity';

@Entity('vaults')
export class Vault {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 100 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'enum', enum: VisibilityLevel, default: VisibilityLevel.INHERIT })
    visibilityLevel: VisibilityLevel;

    @ManyToOne(() => Employee)
    @JoinColumn({ name: 'owner_id' })
    owner: Employee;

    @Column({ type: 'uuid' })
    ownerId: string;

    @Column({ type: 'uuid', nullable: true })
    parentId: string | null;

    @ManyToOne(() => Vault, (vault) => vault.children, { nullable: true })
    @JoinColumn({ name: 'parent_id' })
    parent: Vault;

    @OneToMany(() => Vault, (vault) => vault.parent)
    children: Vault[];

    @OneToMany(() => Credential, (credential) => credential.vault)
    credentials: Credential[];

    @OneToMany(() => VaultVisibilityCompany, (vvc) => vvc.vault)
    visibilityCompanies: VaultVisibilityCompany[];

    @OneToMany(() => VaultVisibilityArea, (vva) => vva.vault)
    visibilityAreas: VaultVisibilityArea[];

    @OneToMany(() => VaultVisibilityPosition, (vvp) => vvp.vault)
    visibilityPositions: VaultVisibilityPosition[];

    @OneToMany(() => VaultVisibilityEmployee, (vve) => vve.vault)
    visibilityEmployees: VaultVisibilityEmployee[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
