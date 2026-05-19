import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Employee } from '@modules/core/employees/entities/employee.entity';
import { Platform } from '../enums/platform.enum';

@Entity('device_tokens')
@Index('idx_device_tokens_employee_active', ['employeeId', 'active'])
@Index('idx_device_tokens_active_last_used', ['active', 'lastUsedAt'])
export class DeviceToken {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'employee_id', type: 'varchar' })
    employeeId: string;

    @ManyToOne(() => Employee)
    @JoinColumn({ name: 'employee_id' })
    employee: Employee;

    @Column({ name: 'fcm_token', type: 'varchar', length: 255, unique: true })
    fcmToken: string;

    @Column({ type: 'enum', enum: Platform })
    platform: Platform;

    @Column({ type: 'boolean', default: true })
    active: boolean;

    @Column({ name: 'last_used_at', type: 'timestamp', nullable: true })
    lastUsedAt: Date | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
