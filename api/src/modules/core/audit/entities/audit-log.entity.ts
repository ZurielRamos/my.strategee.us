import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    entityName: string;

    @Column()
    entityId: string;

    @Column()
    action: string; // 'create' | 'update' | 'delete'

    @Column({ nullable: true })
    userId: string;

    @Column({ type: 'json', nullable: true })
    changes: any;

    @CreateDateColumn()
    createdAt: Date;
}
