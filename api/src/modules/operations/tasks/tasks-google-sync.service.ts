import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { In, Repository } from 'typeorm';
import {
    GoogleTask, GoogleTaskInput, GoogleTasksError, GoogleTasksService,
} from '@modules/iam/google-workspace/tasks/google-tasks.service';
import { Task, TaskSource, TaskStatus } from './entities/task.entity';
import { Board, BoardType } from './entities/board.entity';
import { GoogleTaskList } from './entities/google-task-list.entity';
import { BoardsService } from './boards/boards.service';
import { TasksService } from './tasks.service';
import {
    BOARD_DELETED_EVENT, BOARD_RENAMED_EVENT, BoardDeletedPayload, BoardRenamedPayload,
    TASK_CHANGED_EVENT, TASK_REMOVED_EVENT, TaskChangedPayload, TaskRemovedPayload,
} from './tasks.events';

/**
 * Sincroniza las tareas con Google Tasks. Cada tarea va al Google de su responsable,
 * en una lista con el nombre de su tablero.
 * - Envío: cada cambio local marca la tarea como pendiente de enviar.
 * - Lectura: lo hecho en Google vuelve a My Strategee. Completar o reabrir mueve la tarea a la
 *   primera lista de hechas o pendientes. En tareas de un acta, título y fecha los define el acta.
 */
@Injectable()
export class TasksGoogleSyncService {
    private readonly logger = new Logger(TasksGoogleSyncService.name);
    private pulling = false;

    constructor(
        @InjectRepository(Task) private readonly taskRepository: Repository<Task>,
        @InjectRepository(Board) private readonly boardRepository: Repository<Board>,
        @InjectRepository(GoogleTaskList) private readonly googleListRepository: Repository<GoogleTaskList>,
        private readonly googleTasks: GoogleTasksService,
        private readonly boardsService: BoardsService,
        private readonly tasksService: TasksService,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    // --- Eventos ---

    @OnEvent(TASK_CHANGED_EVENT, { async: true })
    async onTaskChanged({ taskId }: TaskChangedPayload): Promise<void> {
        try {
            const task = await this.taskRepository.findOne({ where: { id: taskId } });
            if (task?.googleSyncPending && task.boardId && await this.googleTasks.isConnected(task.assigneeUserId)) {
                await this.push(task);
            }
        } catch (error) {
            this.logger.warn(`No se pudo enviar la tarea ${taskId} a Google Tasks: ${error}`);
        }
    }

    @OnEvent(TASK_REMOVED_EVENT, { async: true })
    async onTaskRemoved({ userId, boardId, googleTaskId }: TaskRemovedPayload): Promise<void> {
        try {
            const mapping = await this.googleListRepository.findOne({ where: { userId, boardId } });
            if (mapping && await this.googleTasks.isConnected(userId)) {
                await this.googleTasks.remove(userId, mapping.googleListId, googleTaskId);
            }
        } catch (error) {
            this.logger.warn(`No se pudo borrar la tarea ${googleTaskId} de Google Tasks: ${error}`);
        }
    }

    @OnEvent(BOARD_RENAMED_EVENT, { async: true })
    async onBoardRenamed({ boardId, name }: BoardRenamedPayload): Promise<void> {
        for (const mapping of await this.googleListRepository.find({ where: { boardId } })) {
            try {
                await this.googleTasks.renameList(mapping.userId, mapping.googleListId, name);
            } catch (error) {
                this.logger.warn(`No se pudo renombrar la lista de Google del tablero ${boardId}: ${error}`);
            }
        }
    }

    @OnEvent(BOARD_DELETED_EVENT, { async: true })
    async onBoardDeleted({ lists }: BoardDeletedPayload): Promise<void> {
        for (const { userId, googleListId } of lists) {
            try {
                await this.googleTasks.deleteList(userId, googleListId);
            } catch (error) {
                this.logger.warn(`No se pudo borrar la lista ${googleListId} de Google Tasks: ${error}`);
            }
        }
    }

    // --- Envío a Google ---

    /** Envía todas las tareas con cambios pendientes de los usuarios conectados. */
    async pushPending(): Promise<void> {
        for (const userId of await this.googleTasks.connectedUserIds()) {
            const tasks = await this.taskRepository.find({ where: { assigneeUserId: userId, googleSyncPending: true } });
            for (const task of tasks.filter((t) => t.boardId)) {
                try {
                    await this.push(task);
                } catch (error) {
                    this.logger.warn(`No se pudo enviar la tarea ${task.id} a Google Tasks: ${error}`);
                }
            }
        }
    }

    async push(task: Task): Promise<void> {
        const board = await this.boardRepository.findOne({ where: { id: task.boardId! }, relations: ['lists'] });
        if (!board) return;
        const listId = await this.ensureList(task.assigneeUserId, board);
        const input = this.toGoogle(task);
        let remote: GoogleTask;
        if (task.googleTaskId) {
            try {
                remote = await this.googleTasks.patch(task.assigneeUserId, listId, task.googleTaskId, input);
            } catch (error) {
                // Se borró en Google o la lista es nueva: se vuelve a crear.
                if (!(error instanceof GoogleTasksError && error.status === 404)) throw error;
                remote = await this.googleTasks.insert(task.assigneeUserId, listId, input);
            }
        } else {
            remote = await this.googleTasks.insert(task.assigneeUserId, listId, input);
        }
        await this.taskRepository.update(task.id, {
            googleTaskId: remote.id,
            googleUpdatedAt: remote.updated,
            googleSyncPending: false,
        });
    }

    /** Lista de Google del usuario para el tablero; la crea si no existe o fue borrada en Google. */
    private async ensureList(userId: string, board: Board): Promise<string> {
        const mapping = await this.googleListRepository.findOne({ where: { userId, boardId: board.id } });
        if (mapping && await this.googleTasks.listExists(userId, mapping.googleListId)) {
            return mapping.googleListId;
        }
        const googleListId = await this.googleTasks.createList(userId, board.name);
        await this.googleListRepository.save({ ...(mapping ?? { userId, boardId: board.id }), googleListId, pulledAt: null });
        return googleListId;
    }

    // --- Lectura desde Google ---

    async pullAll(): Promise<void> {
        if (this.pulling) return;
        this.pulling = true;
        try {
            const connected = await this.googleTasks.connectedUserIds();
            const mappings = connected.length
                ? await this.googleListRepository.find({ where: { userId: In(connected) } })
                : [];
            for (const mapping of mappings) {
                try {
                    await this.pullList(mapping);
                } catch (error) {
                    this.logger.warn(`No se pudieron leer los cambios de Google Tasks (usuario ${mapping.userId}): ${error}`);
                }
            }
        } finally {
            this.pulling = false;
        }
    }

    async pullList(mapping: GoogleTaskList): Promise<void> {
        const board = await this.boardRepository.findOne({ where: { id: mapping.boardId }, relations: ['lists', 'shares'] });
        if (!board) return;
        const startedAt = new Date().toISOString();
        let remoteTasks: GoogleTask[];
        try {
            remoteTasks = await this.googleTasks.listUpdated(mapping.userId, mapping.googleListId, mapping.pulledAt);
        } catch (error) {
            // Lista borrada en Google: se recreará en el próximo envío.
            if (error instanceof GoogleTasksError && error.status === 404) {
                await this.googleListRepository.delete(mapping.id);
                await this.taskRepository.update(
                    { boardId: board.id, assigneeUserId: mapping.userId },
                    { googleTaskId: null, googleUpdatedAt: null, googleSyncPending: true },
                );
                return;
            }
            throw error;
        }
        for (const remote of remoteTasks) {
            const task = await this.taskRepository.findOne({ where: { googleTaskId: remote.id, assigneeUserId: mapping.userId } });
            await this.applyRemote(mapping.userId, board, remote, task);
        }
        await this.googleListRepository.update(mapping.id, { pulledAt: startedAt });
    }

    private async applyRemote(userId: string, board: Board, remote: GoogleTask, task: Task | null): Promise<void> {
        if (remote.deleted) {
            if (!task) return;
            if (task.source === TaskSource.MANUAL) {
                await this.taskRepository.remove(task);
            } else {
                // Las tareas de un acta no se borran; solo dejan de estar en Google.
                await this.taskRepository.update(task.id, { googleTaskId: null, googleUpdatedAt: null, googleSyncPending: false });
            }
            return;
        }

        if (!task) {
            await this.createFromGoogle(userId, board, remote);
            return;
        }

        // Ya conocida (por ejemplo, el propio envío) o con cambios locales aún sin enviar: gana lo local.
        if ((task.googleUpdatedAt && remote.updated <= task.googleUpdatedAt) || task.googleSyncPending) {
            return;
        }

        let needsPush = false;
        const done = remote.status === 'completed';
        if (done !== (task.status === TaskStatus.DONE)) {
            try {
                await this.tasksService.moveToState(task, done, true);
            } catch (error) {
                // recapmeeting rechazó el cambio: se revierte en Google.
                this.logger.warn(`No se pudo aplicar en recapmeeting el estado de la tarea ${task.id}: ${error}`);
                needsPush = true;
            }
        }
        if (task.source === TaskSource.MANUAL) {
            task.title = (remote.title ?? '').trim().slice(0, 500) || task.title;
            task.description = remote.notes?.trim() || null;
            task.dueDate = remote.due ? remote.due.slice(0, 10) : null;
        } else if (this.contentDiffers(task, remote)) {
            // En las tareas de un acta, título y fecha vienen del acta: se restauran en Google.
            needsPush = true;
        }

        task.googleUpdatedAt = remote.updated;
        task.googleSyncPending = needsPush;
        await this.taskRepository.save(task);
        if (needsPush) {
            this.eventEmitter.emit(TASK_CHANGED_EVENT, { taskId: task.id } satisfies TaskChangedPayload);
        }
    }

    /** Tarea creada directamente en la lista de Google del tablero. */
    private async createFromGoogle(userId: string, board: Board, remote: GoogleTask): Promise<void> {
        const title = (remote.title ?? '').trim();
        // El tablero Recapmeeting solo tiene compromisos de actas.
        if (!title || board.type === BoardType.RECAPMEETING) return;
        // El usuario pudo perder el acceso al tablero.
        if (!(await this.boardsService.memberIds(board)).includes(userId)) return;

        const done = remote.status === 'completed';
        const list = await this.boardsService.firstList(board.id, done);
        await this.taskRepository.save(this.taskRepository.create({
            boardId: board.id,
            listId: list.id,
            position: await this.boardsService.nextPosition(list.id),
            assigneeUserId: userId,
            title: title.slice(0, 500),
            description: remote.notes?.trim() || null,
            dueDate: remote.due ? remote.due.slice(0, 10) : null,
            status: list.isDone ? TaskStatus.DONE : TaskStatus.PENDING,
            completedAt: list.isDone ? new Date(remote.completed ?? remote.updated) : null,
            source: TaskSource.MANUAL,
            googleTaskId: remote.id,
            googleUpdatedAt: remote.updated,
            googleSyncPending: false,
        }));
    }

    private contentDiffers(task: Task, remote: GoogleTask): boolean {
        const expected = this.toGoogle(task);
        return (remote.title ?? '') !== expected.title || (remote.due?.slice(0, 10) ?? null) !== (expected.dueDate ?? null);
    }

    private toGoogle(task: Task): GoogleTaskInput {
        let notes = task.description ?? '';
        if (task.source === TaskSource.RECAPMEETING) {
            const origin = [
                task.recapMinuteNumber ? `Acta #${task.recapMinuteNumber}` : 'Acta',
                task.recapClientName,
                task.recapProjectName,
            ].filter(Boolean).join(' · ');
            notes = [origin, notes].filter(Boolean).join('\n\n');
        }
        return {
            title: task.title,
            notes,
            dueDate: task.dueDate,
            done: task.status === TaskStatus.DONE,
        };
    }
}
