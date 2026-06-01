import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Vault } from './vault.entity';
import { Area } from '@modules/organization/areas/entities/area.entity';

@Entity('vault_visibility_areas')
export class VaultVisibilityArea {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Vault, (vault) => vault.visibilityAreas)
    @JoinColumn({ name: 'vault_id' })
    vault: Vault;

    @Column({ type: 'uuid' })
    vaultId: string;

    @ManyToOne(() => Area)
    @JoinColumn({ name: 'area_id' })
    area: Area;

    @Column({ type: 'uuid' })
    areaId: string;
}
