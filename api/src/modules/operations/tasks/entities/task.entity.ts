import {
    Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { User } from '@modules/iam/users/entities/user.entity';
import { Board } from './board.entity';
import { BoardList } from './board-list.entity';

/** Derivado de la lista: DONE si la lista tiene isDone. Se guarda para sincronizar y filtrar. */
export enum TaskStatus {
    PENDING = 'pending',
    DONE = 'done',
}

export enum TaskSource {
    MANUAL = 'manual',
    RECAPMEETING = 'recapmeeting',
}

/**
 * Tarea de un usuario. Puede venir de un compromiso de recapmeeting o crearse a mano.
 * Se sincroniza con el compromiso de origen (estado) y con Google Tasks.
 */
@Entity('tasks')
@Index('IDX_tasks_assignee_status', ['assigneeUserId', 'status'])
@Index('IDX_tasks_list_position', ['listId', 'position'])
export class Task {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    /** Null solo en tareas anteriores a los tableros; se asignan al abrir Tareas o al sincronizar. */
    @Column({ type: 'varchar', length: 36, nullable: true })
    boardId: string | null;

    @ManyToOne(() => Board, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'board_id' })
    board: Board | null;

    @Column({ type: 'varchar', length: 36, nullable: true })
    listId: string | null;

    @ManyToOne(() => BoardList, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'list_id' })
    list: BoardList | null;

    /** Orden dentro de la lista (0 arriba). */
    @Column({ type: 'int', default: 0 })
    position: number;

    /** Responsable: la tarea va a su Google Tasks y, si viene de un acta, es quien responde en recapmeeting. */
    @Column({ type: 'varchar', length: 36 })
    assigneeUserId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'assignee_user_id' })
    assignee: User;

    @Column({ type: 'varchar', length: 500 })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    /** YYYY-MM-DD */
    @Column({ type: 'date', nullable: true })
    dueDate: string | null;

    @Column({ type: 'varchar', length: 20, default: TaskStatus.PENDING })
    status: TaskStatus;

    @Column({ type: 'datetime', nullable: true })
    completedAt: Date | null;

    @Column({ type: 'varchar', length: 20, default: TaskSource.MANUAL })
    source: TaskSource;

    // --- Origen en recapmeeting ---

    @Column({ type: 'int', nullable: true, unique: true })
    recapCommitmentId: number | null;

    @Column({ type: 'int', nullable: true })
    recapMinuteId: number | null;

    @Column({ type: 'varchar', length: 32, nullable: true })
    recapMinuteNumber: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    recapClientName: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    recapProjectName: string | null;

    /** "modified" del compromiso en recapmeeting la última vez que se sincronizó. */
    @Column({ type: 'varchar', length: 20, nullable: true })
    recapModifiedAt: string | null;

    // --- Google Tasks ---

    @Column({ type: 'varchar', length: 255, nullable: true })
    googleTaskId: string | null;

    /** "updated" de la tarea en Google tras la última sincronización (para detectar cambios hechos allá). */
    @Column({ type: 'varchar', length: 40, nullable: true })
    googleUpdatedAt: string | null;

    /** Hay cambios locales que aún no se han enviado a Google Tasks. */
    @Column({ type: 'boolean', default: true })
    googleSyncPending: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
