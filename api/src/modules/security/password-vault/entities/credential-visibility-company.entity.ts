import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Credential } from './credential.entity';
import { Company } from '@modules/organization/companies/entities/company.entity';

@Entity('credential_visibility_companies')
export class CredentialVisibilityCompany {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Credential, (credential) => credential.visibilityCompanies)
    @JoinColumn({ name: 'credential_id' })
    credential: Credential;

    @Column({ type: 'uuid' })
    credentialId: string;

    @ManyToOne(() => Company)
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @Column({ type: 'uuid' })
    companyId: string;
}
