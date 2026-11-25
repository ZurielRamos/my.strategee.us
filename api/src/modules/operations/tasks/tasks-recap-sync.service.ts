import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { User } from '@modules/iam/users/entities/user.entity';
import { MinutesService, RecapCommitment } from '../minutes/minutes.service';
import { BoardsService } from './boards/boards.service';
import { TasksService } from './tasks.service';
import { Task, TaskSource, TaskStatus } from './entities/task.entity';
import { TaskSyncState } from './entities/task-sync-state.entity';
import { TASK_CHANGED_EVENT, TASK_REMOVED_EVENT, TaskChangedPayload, TaskRemovedPayload } from './tasks.events';

const CURSOR_KEY = 'recap_commitments_modified';
const PAGE_SIZE = 100;
const TITLE_MAX = 500;
/** Estado de Taskee para un compromiso terminado. */
const RECAP_DONE_STATE = '2';

export interface RecapSyncResult {
    created: number;
    updated: number;
    skippedNoUser: number;
}

/**
 * Convierte los compromisos de actas finalizadas en tareas de su responsable
 * (se empareja por correo con los usuarios de My Strategee), en su tablero Recapmeeting.
 */
@Injectable()
export class TasksRecapSyncService {
    private readonly logger = new Logger(TasksRecapSyncService.name);
    private running = false;

    constructor(
        @InjectRepository(Task)
        private readonly taskRepository: Repository<Task>,
        @InjectRepository(TaskSyncState)
        private readonly stateRepository: Repository<TaskSyncState>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly minutesService: MinutesService,
        private readonly boardsService: BoardsService,
        private readonly tasksService: TasksService,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    /**
     * Sincroniza los compromisos modificados desde la última vez (o todos si full).
     * Si ya hay una sincronización en curso, no hace nada.
     */
    async sync(full = false): Promise<RecapSyncResult | null> {
        if (this.running) {
            return null;
        }
        this.running = true;
        const result: RecapSyncResult = { created: 0, updated: 0, skippedNoUser: 0 };
        try {
            const usersByEmail = await this.loadUsersByEmail();
            const cursor = full ? null : (await this.stateRepository.findOne({ where: { key: CURSOR_KEY } }))?.value ?? null;
            let maxModified = cursor;

            for (let page = 1; ; page++) {
                const rows = await this.minutesService.listCommitments(cursor, page);
                for (const row of rows) {
                    const outcome = await this.upsert(row, usersByEmail, full);
                    if (outcome) result[outcome]++;
                    if (!maxModified || row.Commitment.modified > maxModified) {
                        maxModified = row.Commitment.modified;
                    }
                }
                if (rows.length < PAGE_SIZE) break;
            }

            if (maxModified) {
                await this.stateRepository.save({ key: CURSOR_KEY, value: maxModified });
            }
            if (result.created || result.updated) {
                this.logger.log(`Compromisos sincronizados: ${result.created} nuevos, ${result.updated} actualizados`);
            }
            return result;
        } finally {
            this.running = false;
        }
    }

    private async loadUsersByEmail(): Promise<Map<string, string>> {
        const users = await this.userRepository.find({ where: { isActive: true }, select: ['id', 'email'] });
        return new Map(users.map((u) => [u.email.toLowerCase(), u.id]));
    }

    private async upsert(
        row: RecapCommitment,
        usersByEmail: Map<string, string>,
        full: boolean,
    ): Promise<'created' | 'updated' | 'skippedNoUser' | null> {
        const commitment = row.Commitment;
        const assigneeUserId = usersByEmail.get((row.User?.email ?? '').toLowerCase());
        if (!assigneeUserId) {
            return 'skippedNoUser';
        }

        const text = toPlainText(commitment.description);
        const recapDone = commitment.state === RECAP_DONE_STATE;
        const fields = {
            assigneeUserId,
            title: truncate(text || '(Compromiso sin descripción)', TITLE_MAX),
            description: text.length > TITLE_MAX ? text : null,
            dueDate: validDate(commitment.delivery_date),
            recapMinuteId: row.Contac?.id ? Number(row.Contac.id) : null,
            recapMinuteNumber: row.Contac?.number || null,
            recapClientName: row.Client?.name || null,
            recapProjectName: row.Project?.name || null,
        };

        const commitmentId = Number(commitment.id);
        const existing = await this.taskRepository.findOne({ where: { recapCommitmentId: commitmentId } });

        if (!existing) {
            // Un compromiso que ya estaba terminado no genera tarea: evita importar
            // (y enviar a Google Tasks) todo el historial en la primera sincronización.
            if (recapDone) {
                return null;
            }
            const board = await this.boardsService.ensureRecapBoard(assigneeUserId);
            const list = await this.boardsService.firstList(board.id, false);
            const task = await this.taskRepository.save(this.taskRepository.create({
                ...fields,
                boardId: board.id,
                listId: list.id,
                position: await this.boardsService.nextPosition(list.id),
                status: TaskStatus.PENDING,
                completedAt: null,
                source: TaskSource.RECAPMEETING,
                recapCommitmentId: commitmentId,
                recapModifiedAt: commitment.modified,
                googleSyncPending: true,
            }));
            this.emitChanged(task.id);
            return 'created';
        }

        if (!full && existing.recapModifiedAt === commitment.modified) {
            return null;
        }

        const changed = (Object.keys(fields) as (keyof typeof fields)[])
            .filter((key) => (existing[key] ?? null) !== (fields[key] ?? null));
        const statusChanged = recapDone !== (existing.status === TaskStatus.DONE);
        existing.recapModifiedAt = commitment.modified;
        if (changed.length === 0 && !statusChanged && existing.boardId) {
            await this.taskRepository.save(existing);
            return null;
        }

        if (changed.includes('assigneeUserId') || !existing.boardId) {
            // Cambió el responsable (o es una tarea anterior a los tableros): pasa a su tablero Recapmeeting.
            if (existing.googleTaskId && existing.boardId) {
                this.eventEmitter.emit(TASK_REMOVED_EVENT, {
                    userId: existing.assigneeUserId, boardId: existing.boardId, googleTaskId: existing.googleTaskId,
                } satisfies TaskRemovedPayload);
            }
            Object.assign(existing, fields, { googleTaskId: null, googleUpdatedAt: null });
            const board = await this.boardsService.ensureRecapBoard(assigneeUserId);
            existing.boardId = board.id;
            existing.listId = null;
            await this.tasksService.moveToState(existing, recapDone, false);
        } else {
            Object.assign(existing, fields);
            if (statusChanged) {
                // Terminado o reabierto en recapmeeting: pasa a la primera lista de hechas o pendientes.
                await this.tasksService.moveToState(existing, recapDone, false);
            }
        }
        if (recapDone && statusChanged) {
            existing.completedAt = parseRecapDate(commitment.finished_date) ?? new Date();
        }
        existing.googleSyncPending = true;
        await this.taskRepository.save(existing);
        this.emitChanged(existing.id);
        return 'updated';
    }

    private emitChanged(taskId: string) {
        this.eventEmitter.emit(TASK_CHANGED_EVENT, { taskId } satisfies TaskChangedPayload);
    }
}

/** Texto plano de la descripción del compromiso (puede venir con HTML del editor). */
export function toPlainText(html: string | null | undefined): string {
    if (!html) return '';
    return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(p|div|li)>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&([a-z])(acute|tilde|uml);/gi, (_, letter, accent) => letter.normalize('NFD') + ({ acute: '\u0301', tilde: '\u0303', uml: '\u0308' } as Record<string, string>)[accent.toLowerCase()])
        .normalize('NFC')
        .replace(/[ \t]+/g, ' ')
        .replace(/\s*\n\s*/g, '\n')
        .trim();
}

function truncate(text: string, max: number): string {
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function validDate(value: string | null | undefined): string | null {
    return value && /^\d{4}-\d{2}-\d{2}$/.test(value) && value !== '0000-00-00' ? value : null;
}

function parseRecapDate(value: string | null | undefined): Date | null {
    const date = validDate(value?.slice(0, 10));
    return date ? new Date(`${date}T12:00:00`) : null;
}
