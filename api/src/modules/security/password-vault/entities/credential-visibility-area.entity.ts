import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Credential } from './credential.entity';
import { Area } from '@modules/organization/areas/entities/area.entity';

@Entity('credential_visibility_areas')
export class CredentialVisibilityArea {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Credential, (credential) => credential.visibilityAreas)
    @JoinColumn({ name: 'credential_id' })
    credential: Credential;

    @Column({ type: 'uuid' })
    credentialId: string;

    @ManyToOne(() => Area)
    @JoinColumn({ name: 'area_id' })
    area: Area;

    @Column({ type: 'uuid' })
    areaId: string;
}
