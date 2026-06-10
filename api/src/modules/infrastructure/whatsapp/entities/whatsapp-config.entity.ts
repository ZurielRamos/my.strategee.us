import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('whatsapp_config')
export class WhatsappConfig {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ comment: 'URL base de Evolution API' })
    apiUrl: string;

    @Column({ comment: 'API Key de autenticación de Evolution API' })
    apiKey: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
