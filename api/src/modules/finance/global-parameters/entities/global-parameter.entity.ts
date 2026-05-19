import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { GlobalParameterKey } from '../enums/global-parameter-key.enum';

@Entity('global_parameters')
export class GlobalParameter {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 100 })
    key: string;

    @Column('decimal', { precision: 10, scale: 2 })
    value: number;

    @Column('date')
    validFrom: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
