import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('api_keys')
export class ApiKey {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ comment: 'Nombre descriptivo de la API key' })
    name: string;

    @Column({ comment: 'Hash SHA-256 de la API key (nunca se almacena en texto plano)' })
    keyHash: string;

    @Column({ length: 8, comment: 'Prefijo visible de la key para identificación' })
    keyPrefix: string;

    @Column({ length: 8, comment: 'Sufijo visible de la key para identificación' })
    keySuffix: string;

    @Column({ default: true, comment: 'Indica si la API key está activa' })
    isActive: boolean;

    @Column({ nullable: true, comment: 'Fecha del último uso de la API key' })
    lastUsedAt: Date;

    @Column({ nullable: true, comment: 'IP desde la cual se usó por última vez' })
    lastUsedIp: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
