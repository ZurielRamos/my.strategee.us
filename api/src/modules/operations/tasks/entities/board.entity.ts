import {
    Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { User } from '@modules/iam/users/entities/user.entity';
import { BoardList } from './board-list.entity';
import { BoardShare } from './board-share.entity';

export enum BoardType {
    /** Tablero personal con los compromisos de recapmeeting. Uno por usuario, no se borra ni se comparte. */
    RECAPMEETING = 'recapmeeting',
    CUSTOM = 'custom',
}

export const RECAP_BOARD_NAME = 'Recapmeeting';

@Entity('boards')
@Index('IDX_boards_owner', ['ownerUserId'])
export class Board {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 36 })
    ownerUserId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'owner_user_id' })
    owner: User;

    @Column({ type: 'varchar', length: 120 })
    name: string;

    @Column({ type: 'varchar', length: 20, default: BoardType.CUSTOM })
    type: BoardType;

    @OneToMany(() => BoardList, (list) => list.board)
    lists: BoardList[];

    @OneToMany(() => BoardShare, (share) => share.board)
    shares: BoardShare[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
