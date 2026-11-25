import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/** Cursores de sincronización (por ejemplo, el último "modified" leído de recapmeeting). */
@Entity('task_sync_state')
export class TaskSyncState {
    @PrimaryColumn({ type: 'varchar', length: 100 })
    key: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    value: string | null;

    @UpdateDateColumn()
    updatedAt: Date;
}
