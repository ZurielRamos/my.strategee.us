import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    JoinColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { User } from '@modules/iam/users/entities/user.entity';

/**
 * Autorización de Google Workspace de un usuario.
 * El refresh token se guarda cifrado con AES-256-GCM.
 */
@Entity('google_workspace_tokens')
export class GoogleWorkspaceToken {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 36, unique: true })
    userId: string;

    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'varchar', length: 255 })
    googleEmail: string;

    @Column({ type: 'text' })
    @Exclude()
    encryptedRefreshToken: string;

    /** Permisos concedidos, separados por espacio. */
    @Column({ type: 'text' })
    scopes: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
