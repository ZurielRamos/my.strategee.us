import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '@modules/iam/users/entities/user.entity';

@Entity('sessions')
export class Session {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    userId: string;

    @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ type: 'text' })
    refreshToken: string; // Hashed refresh token

    @Column({ type: 'varchar', length: 255, nullable: true })
    deviceName: string; // e.g., "Chrome on macOS"

    @Column({ type: 'varchar', length: 50, nullable: true })
    deviceType: string; // mobile, desktop, tablet

    @Column({ type: 'varchar', length: 100, nullable: true })
    ipAddress: string;

    @Column({ type: 'text', nullable: true })
    userAgent: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    lastUsedAt: Date;

    @Column({ type: 'timestamp' })
    expiresAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
