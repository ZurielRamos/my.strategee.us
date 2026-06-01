import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Vault } from './vault.entity';
import { Company } from '@modules/organization/companies/entities/company.entity';

@Entity('vault_visibility_companies')
export class VaultVisibilityCompany {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Vault, (vault) => vault.visibilityCompanies)
    @JoinColumn({ name: 'vault_id' })
    vault: Vault;

    @Column({ type: 'uuid' })
    vaultId: string;

    @ManyToOne(() => Company)
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @Column({ type: 'uuid' })
    companyId: string;
}
