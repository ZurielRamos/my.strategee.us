import { DeleteDateColumn, Column } from 'typeorm';

/**
 * Base entity for entities that support soft delete
 * Entities extending this will have deletedAt timestamp and isDeleted flag
 */
export abstract class BaseSoftDeleteEntity {
    @DeleteDateColumn()
    deletedAt?: Date;

    @Column({ default: false })
    isDeleted: boolean;
}
