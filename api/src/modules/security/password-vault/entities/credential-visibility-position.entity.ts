import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Credential } from './credential.entity';
import { Position } from '@modules/organization/positions/entities/position.entity';

@Entity('credential_visibility_positions')
export class CredentialVisibilityPosition {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Credential, (credential) => credential.visibilityPositions)
    @JoinColumn({ name: 'credential_id' })
    credential: Credential;

    @Column({ type: 'uuid' })
    credentialId: string;

    @ManyToOne(() => Position)
    @JoinColumn({ name: 'position_id' })
    position: Position;

    @Column({ type: 'uuid' })
    positionId: string;
}
