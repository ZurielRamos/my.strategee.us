import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Board } from './board.entity';

/** Columna de un tablero. Si isDone, las tareas que están en ella cuentan como hechas. */
@Entity('board_lists')
export class BoardList {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 36 })
    boardId: string;

    @ManyToOne(() => Board, (board) => board.lists, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'board_id' })
    board: Board;

    @Column({ type: 'varchar', length: 80 })
    name: string;

    @Column({ type: 'int', default: 0 })
    position: number;

    @Column({ type: 'boolean', default: false })
    isDone: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
