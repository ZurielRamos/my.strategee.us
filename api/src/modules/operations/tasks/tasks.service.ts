import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { UsersService } from '@modules/iam/users/users.service';
import { MinutesService } from '../minutes/minutes.service';
import { Task, TaskSource, TaskStatus } from './entities/task.entity';
import { BoardType } from './entities/board.entity';
import { BoardList } from './entities/board-list.entity';
import { BoardsService } from './boards/boards.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { TASK_CHANGED_EVENT, TASK_REMOVED_EVENT, TaskChangedPayload, TaskRemovedPayload } from './tasks.events';

@Injectable()
export class TasksService {
    constructor(
        @InjectRepository(Task) private readonly taskRepository: Repository<Task>,
        @InjectRepository(BoardList) private readonly listRepository: Repository<BoardList>,
        private readonly boardsService: BoardsService,
        private readonly usersService: UsersService,
        private readonly minutesService: MinutesService,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    /** Tareas de un tablero al que el usuario tiene acceso, en el orden de cada lista. */
    async listBoardTasks(userId: string, boardId: string): Promise<Task[]> {
        await this.boardsService.getAccess(userId, boardId);
        return this.taskRepository.find({
            where: { boardId },
            order: { position: 'ASC', createdAt: 'ASC' },
        });
    }

    async get(userId: string, id: string): Promise<Task> {
        const task = await this.taskRepository.findOne({ where: { id } });
        if (!task?.boardId) throw new NotFoundException('Tarea no encontrada');
        await this.boardsService.getAccess(userId, task.boardId);
        return task;
    }

    /** Crea una tarea manual en un tablero personalizado (el tablero Recapmeeting solo tiene compromisos). */
    async create(userId: string, dto: CreateTaskDto): Promise<Task> {
        const { board } = await this.boardsService.getAccess(userId, dto.boardId);
        if (board.type === BoardType.RECAPMEETING) {
            throw new BadRequestException('En el tablero Recapmeeting solo hay compromisos de actas');
        }
        const list = dto.listId
            ? this.findBoardList(board.lists, dto.listId)
            : await this.boardsService.firstList(board.id, false);
        const assigneeUserId = dto.assigneeUserId ?? userId;
        await this.assertMember(board, assigneeUserId);

        const task = await this.taskRepository.save(this.taskRepository.create({
            boardId: board.id,
            listId: list.id,
            position: await this.boardsService.nextPosition(list.id),
            assigneeUserId,
            title: dto.title,
            description: dto.description || null,
            dueDate: dto.dueDate ?? null,
            status: list.isDone ? TaskStatus.DONE : TaskStatus.PENDING,
            completedAt: list.isDone ? new Date() : null,
            source: TaskSource.MANUAL,
            googleSyncPending: true,
        }));
        this.emitChanged(task);
        return task;
    }

    /**
     * Edita una tarea o la mueve de lista/posición. Las tareas de un acta solo se mueven.
     * Moverla a (o desde) una lista de hechas termina (o reabre) el compromiso en recapmeeting.
     */
    async update(userId: string, id: string, dto: UpdateTaskDto): Promise<Task> {
        const task = await this.get(userId, id);
        const { board } = await this.boardsService.getAccess(userId, task.boardId!);
        const editsContent = dto.title !== undefined || dto.description !== undefined
            || dto.dueDate !== undefined || dto.assigneeUserId !== undefined;
        if (task.source === TaskSource.RECAPMEETING && editsContent) {
            throw new BadRequestException('Las tareas de un acta solo se pueden mover de lista. Edita el compromiso en el acta.');
        }

        if (dto.title !== undefined) task.title = dto.title;
        if (dto.description !== undefined) task.description = dto.description || null;
        if (dto.dueDate !== undefined) task.dueDate = dto.dueDate;
        if (dto.assigneeUserId !== undefined && dto.assigneeUserId !== task.assigneeUserId) {
            await this.assertMember(board, dto.assigneeUserId);
            this.detachFromGoogle(task);
            task.assigneeUserId = dto.assigneeUserId;
        }

        if (dto.listId !== undefined || dto.position !== undefined) {
            const target = dto.listId ? this.findBoardList(board.lists, dto.listId) : this.findBoardList(board.lists, task.listId!);
            await this.moveTask(task, target, dto.position);
        }

        task.googleSyncPending = true;
        const saved = await this.taskRepository.save(task);
        this.emitChanged(saved);
        return saved;
    }

    async remove(userId: string, id: string): Promise<void> {
        const task = await this.get(userId, id);
        if (task.source === TaskSource.RECAPMEETING) {
            throw new BadRequestException('Las tareas de un acta no se pueden eliminar. Muévela a una lista de hechas.');
        }
        await this.taskRepository.remove({ ...task });
        this.detachFromGoogle(task);
    }

    // --- Listas (operaciones que afectan a sus tareas) ---

    /** Marca o desmarca una lista como "hechas": sus tareas cambian de estado. */
    async setListDone(userId: string, listId: string, isDone: boolean): Promise<BoardList> {
        const list = await this.boardsService.getOwnedList(userId, listId);
        if (list.isDone === isDone) return list;
        const { board } = await this.boardsService.getOwned(userId, list.boardId);
        const tasks = await this.taskRepository.find({ where: { listId } });
        if (board.type === BoardType.RECAPMEETING && tasks.length > 0) {
            throw new BadRequestException('Para cambiar esta opción en Recapmeeting, primero mueve los compromisos de la lista');
        }
        this.boardsService.assertListsValid(board, board.lists.map((l) => (l.id === listId ? { ...l, isDone } : l)));

        list.isDone = isDone;
        await this.listRepository.save(list);
        for (const task of tasks) {
            await this.applyDone(task, isDone);
            task.googleSyncPending = true;
            await this.taskRepository.save(task);
            this.emitChanged(task);
        }
        return list;
    }

    /** Borra una lista. Si tiene tareas, se mueven a moveToListId (del mismo tablero). */
    async deleteList(userId: string, listId: string, moveToListId?: string): Promise<void> {
        const list = await this.boardsService.getOwnedList(userId, listId);
        const { board } = await this.boardsService.getOwned(userId, list.boardId);
        this.boardsService.assertListsValid(board, board.lists.filter((l) => l.id !== listId));

        const tasks = await this.taskRepository.find({ where: { listId }, order: { position: 'ASC' } });
        if (tasks.length > 0) {
            if (!moveToListId || moveToListId === listId) {
                throw new BadRequestException('La lista tiene tareas: indica a qué lista moverlas');
            }
            const target = this.findBoardList(board.lists, moveToListId);
            for (const task of tasks) {
                await this.moveTask(task, target);
                task.googleSyncPending = true;
                await this.taskRepository.save(task);
                this.emitChanged(task);
            }
        }
        await this.listRepository.delete(listId);
    }

    // --- Estado ---

    /**
     * Mueve la tarea a la primera lista de hechas o pendientes de su tablero (sin guardar).
     * Lo usan las sincronizaciones cuando el estado cambió en recapmeeting o en Google.
     */
    async moveToState(task: Task, done: boolean, notifyRecap: boolean): Promise<void> {
        const target = await this.boardsService.firstList(task.boardId!, done);
        if (notifyRecap) {
            await this.moveTask(task, target);
        } else {
            await this.placeInList(task, target);
            this.setStatus(task, target.isDone);
        }
    }

    /**
     * Cambia el estado sin mover de lista (sin guardar). Si viene de un acta, primero lo cambia en
     * recapmeeting como su responsable; si recapmeeting falla, lanza el error y la tarea no cambia.
     */
    async applyDone(task: Task, done: boolean): Promise<void> {
        if (done === (task.status === TaskStatus.DONE)) return;
        if (task.source === TaskSource.RECAPMEETING && task.recapCommitmentId) {
            const assignee = await this.usersService.findOne(task.assigneeUserId);
            const result = await this.minutesService.setCommitmentState(assignee.email, String(task.recapCommitmentId), done);
            task.recapModifiedAt = result?.modified ?? task.recapModifiedAt;
        }
        this.setStatus(task, done);
    }

    /** Mueve la tarea a la lista y posición indicadas, aplicando el cambio de estado si corresponde. */
    private async moveTask(task: Task, target: BoardList, position?: number): Promise<void> {
        await this.applyDone(task, target.isDone);
        await this.placeInList(task, target, position);
    }

    /** Inserta la tarea en la lista (al final si no hay posición) y renumera esa lista y la anterior. */
    private async placeInList(task: Task, target: BoardList, position?: number): Promise<void> {
        const previousListId = task.listId;
        const siblings = (await this.taskRepository.find({ where: { listId: target.id }, order: { position: 'ASC', createdAt: 'ASC' } }))
            .filter((t) => t.id !== task.id);
        const index = position === undefined ? siblings.length : Math.max(0, Math.min(position, siblings.length));
        siblings.splice(index, 0, task);
        task.listId = target.id;
        siblings.forEach((t, i) => (t.position = i));
        await this.taskRepository.save(siblings.filter((t) => t.id !== task.id));
        task.position = index;

        if (previousListId && previousListId !== target.id) {
            const remaining = await this.taskRepository.find({ where: { listId: previousListId }, order: { position: 'ASC' } });
            remaining.filter((t) => t.id !== task.id).forEach((t, i) => (t.position = i));
            await this.taskRepository.save(remaining.filter((t) => t.id !== task.id));
        }
    }

    private setStatus(task: Task, done: boolean) {
        if (done === (task.status === TaskStatus.DONE)) return;
        task.status = done ? TaskStatus.DONE : TaskStatus.PENDING;
        task.completedAt = done ? new Date() : null;
    }

    private findBoardList(lists: BoardList[], listId: string): BoardList {
        const list = lists.find((l) => l.id === listId);
        if (!list) throw new BadRequestException('La lista no pertenece a este tablero');
        return list;
    }

    private async assertMember(board: Parameters<BoardsService['memberIds']>[0], userId: string) {
        if (!(await this.boardsService.memberIds(board)).includes(userId)) {
            throw new BadRequestException('El responsable debe tener acceso al tablero');
        }
    }

    /** Quita la tarea del Google Tasks de su responsable actual (borrado o cambio de responsable). */
    private detachFromGoogle(task: Task) {
        if (task.googleTaskId && task.boardId) {
            this.eventEmitter.emit(TASK_REMOVED_EVENT, {
                userId: task.assigneeUserId, boardId: task.boardId, googleTaskId: task.googleTaskId,
            } satisfies TaskRemovedPayload);
        }
        task.googleTaskId = null;
        task.googleUpdatedAt = null;
    }

    private emitChanged(task: Task) {
        this.eventEmitter.emit(TASK_CHANGED_EVENT, { taskId: task.id } satisfies TaskChangedPayload);
    }
}
