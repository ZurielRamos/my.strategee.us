import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm';
import { Employee } from '@modules/core/employees/entities/employee.entity';
import { Attachment } from '@modules/infrastructure/attachments/entities/attachment.entity';
import { Vault } from './vault.entity';
import { VisibilityLevel } from '../enums/visibility-level.enum';
import { CredentialVisibilityCompany } from './credential-visibility-company.entity';
import { CredentialVisibilityArea } from './credential-visibility-area.entity';
import { CredentialVisibilityPosition } from './credential-visibility-position.entity';
import { CredentialVisibilityEmployee } from './credential-visibility-employee.entity';

@Entity('credentials')
export class Credential {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    title: string;

    @Column({ type: 'varchar', length: 500 })
    url: string;

    @Column({ type: 'text' })
    encryptedUsername: string;

    @Column({ type: 'text' })
    encryptedPassword: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    directLoginUrl: string;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ type: 'uuid', nullable: true })
    logoId: string;

    @ManyToOne(() => Attachment, { nullable: true })
    @JoinColumn({ name: 'logo_id' })
    logo: Attachment;

    @Column({ type: 'enum', enum: VisibilityLevel })
    visibilityLevel: VisibilityLevel;

    @ManyToOne(() => Employee)
    @JoinColumn({ name: 'owner_id' })
    owner: Employee;

    @Column({ type: 'uuid' })
    ownerId: string;

    @ManyToOne(() => Vault, (vault) => vault.credentials)
    @JoinColumn({ name: 'vault_id' })
    vault: Vault;

    @Column({ type: 'uuid' })
    vaultId: string;

    @OneToMany(() => CredentialVisibilityCompany, (cvc) => cvc.credential)
    visibilityCompanies: CredentialVisibilityCompany[];

    @OneToMany(() => CredentialVisibilityArea, (cva) => cva.credential)
    visibilityAreas: CredentialVisibilityArea[];

    @OneToMany(() => CredentialVisibilityPosition, (cvp) => cvp.credential)
    visibilityPositions: CredentialVisibilityPosition[];

    @OneToMany(() => CredentialVisibilityEmployee, (cve) => cve.credential)
    visibilityEmployees: CredentialVisibilityEmployee[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
