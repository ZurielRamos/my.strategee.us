import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '@modules/iam/users/entities/user.entity';
import { Board } from './board.entity';

/** Acceso a un tablero: un usuario concreto o todo un departamento (uno de los dos). */
@Entity('board_shares')
export class BoardShare {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 36 })
    boardId: string;

    @ManyToOne(() => Board, (board) => board.shares, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'board_id' })
    board: Board;

    @Column({ type: 'varchar', length: 36, nullable: true })
    userId: string | null;

    @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'user_id' })
    user: User | null;

    @Column({ type: 'varchar', length: 36, nullable: true })
    departmentId: string | null;

    @CreateDateColumn()
    createdAt: Date;
}
