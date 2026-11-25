import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

/** Lista de Google Tasks de un usuario para un tablero (se llama igual que el tablero). */
@Entity('google_task_lists')
@Unique('UQ_google_task_lists_user_board', ['userId', 'boardId'])
export class GoogleTaskList {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 36 })
    userId: string;

    @Column({ type: 'varchar', length: 36 })
    boardId: string;

    @Column({ type: 'varchar', length: 255 })
    googleListId: string;

    /** Última lectura de cambios de Google (RFC 3339). */
    @Column({ type: 'varchar', length: 40, nullable: true })
    pulledAt: string | null;
}
