import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Vault } from './vault.entity';
import { Position } from '@modules/organization/positions/entities/position.entity';

@Entity('vault_visibility_positions')
export class VaultVisibilityPosition {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Vault, (vault) => vault.visibilityPositions)
    @JoinColumn({ name: 'vault_id' })
    vault: Vault;

    @Column({ type: 'uuid' })
    vaultId: string;

    @ManyToOne(() => Position)
    @JoinColumn({ name: 'position_id' })
    position: Position;

    @Column({ type: 'uuid' })
    positionId: string;
}
