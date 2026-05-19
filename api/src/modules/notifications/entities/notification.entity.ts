import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    Index,
} from 'typeorm';
import { Employee } from '@modules/core/employees/entities/employee.entity';
import { Request } from '@modules/operations/requests/entities/request.entity';
import { NotificationType } from '../enums/notification-type.enum';
import { NotificationStatus } from '../enums/notification-status.enum';

@Entity('notifications')
@Index(['employeeId', 'status'])
@Index(['employeeId', 'createdAt'])
@Index(['createdAt'])
export class Notification {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'enum', enum: NotificationType })
    type: NotificationType;

    @Column({ type: 'text' })
    message: string;

    @Column({ type: 'json' })
    metadata: Record<string, any>;

    @Column({
        type: 'enum',
        enum: NotificationStatus,
        default: NotificationStatus.UNREAD,
    })
    status: NotificationStatus;

    @Column({ name: 'employee_id' })
    employeeId: string;

    @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'employee_id' })
    employee: Employee;

    @Column({ name: 'request_id', nullable: true })
    requestId: number;

    @ManyToOne(() => Request, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'request_id' })
    request: Request;

    @Column({ name: 'read_at', type: 'timestamp', nullable: true })
    readAt: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
