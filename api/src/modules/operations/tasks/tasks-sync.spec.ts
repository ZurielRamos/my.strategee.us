import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GoogleTasksError } from '@modules/iam/google-workspace/tasks/google-tasks.service';
import { Task, TaskSource, TaskStatus } from './entities/task.entity';
import { Board, BoardType } from './entities/board.entity';
import { BoardList } from './entities/board-list.entity';
import { TasksRecapSyncService, toPlainText } from './tasks-recap-sync.service';
import { TasksGoogleSyncService } from './tasks-google-sync.service';
import { TasksService } from './tasks.service';
import { TASK_CHANGED_EVENT, TASK_REMOVED_EVENT } from './tasks.events';

/** Repositorio en memoria con lo mínimo que usan los servicios. */
function memoryRepo<T extends { id?: string }>(prefix = 'id') {
    const rows: T[] = [];
    let seq = 0;
    const matches = (row: any, where: any) => Object.entries(where ?? {}).every(([k, v]) => row[k] === v);
    const sort = (list: T[], order?: Record<string, 'ASC' | 'DESC'>) => {
        if (!order) return list;
        const [[key, dir]] = Object.entries(order);
        return [...list].sort((a: any, b: any) => (a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0) * (dir === 'DESC' ? -1 : 1));
    };
    return {
        rows,
        create: (data: Partial<T>) => ({ ...data }) as T,
        save: jest.fn(async (entity: T | T[]) => {
            const list = Array.isArray(entity) ? entity : [entity];
            for (const item of list) {
                if (!item.id) {
                    item.id = `${prefix}${++seq}`;
                    rows.push(item);
                } else if (!rows.includes(item)) {
                    const index = rows.findIndex((r) => r.id === item.id);
                    if (index >= 0) rows[index] = item; else rows.push(item);
                }
            }
            return entity;
        }),
        findOne: jest.fn(async ({ where, order }: any) => sort(rows.filter((r) => matches(r, where)), order)[0] ?? null),
        find: jest.fn(async ({ where, order }: any = {}) => sort(rows.filter((r) => matches(r, where)), order)),
        update: jest.fn(async (criteria: any, changes: Partial<T>) => {
            const where = typeof criteria === 'string' ? { id: criteria } : criteria;
            rows.filter((r) => matches(r, where)).forEach((r) => Object.assign(r, changes));
        }),
        remove: jest.fn(async (entity: T) => {
            const index = rows.findIndex((r) => r.id === entity.id);
            if (index >= 0) rows.splice(index, 1);
        }),
        delete: jest.fn(async (criteria: any) => {
            const where = typeof criteria === 'string' ? { id: criteria } : criteria;
            for (const r of rows.filter((row) => matches(row, where))) rows.splice(rows.indexOf(r), 1);
        }),
    };
}

/** Tablero con listas Pendiente, En progreso, Hecha. */
function makeBoard(id: string, type = BoardType.CUSTOM, ownerUserId = 'u1'): Board {
    const lists = [
        { id: `${id}-todo`, boardId: id, name: 'Pendiente', position: 0, isDone: false },
        { id: `${id}-doing`, boardId: id, name: 'En progreso', position: 1, isDone: false },
        { id: `${id}-done`, boardId: id, name: 'Hecha', position: 2, isDone: true },
    ] as BoardList[];
    return { id, type, ownerUserId, name: id, lists, shares: [] } as unknown as Board;
}

/** BoardsService simulado sobre tableros en memoria. */
function fakeBoards(boards: Board[], taskRepo: ReturnType<typeof memoryRepo<Task>>, members = ['u1', 'u2']) {
    const byId = (id: string) => {
        const board = boards.find((b) => b.id === id);
        if (!board) throw new NotFoundException('Tablero no encontrado');
        return board;
    };
    return {
        getAccess: jest.fn(async (_userId: string, boardId: string) => ({ board: byId(boardId), isOwner: true })),
        getOwned: jest.fn(async (_userId: string, boardId: string) => ({ board: byId(boardId), isOwner: true })),
        getOwnedList: jest.fn(async (_userId: string, listId: string) => boards.flatMap((b) => b.lists).find((l) => l.id === listId)),
        firstList: jest.fn(async (boardId: string, done: boolean) => byId(boardId).lists.find((l) => l.isDone === done)),
        nextPosition: jest.fn(async (listId: string) => taskRepo.rows.filter((t) => t.listId === listId).length),
        ensureRecapBoard: jest.fn(async (userId: string) =>
            boards.find((b) => b.type === BoardType.RECAPMEETING && b.ownerUserId === userId)
            ?? (() => { const b = makeBoard(`recap-${userId}`, BoardType.RECAPMEETING, userId); boards.push(b); return b; })()),
        memberIds: jest.fn(async () => members),
        assertListsValid: jest.fn(),
    };
}

const commitment = (overrides: Record<string, any> = {}) => ({
    Commitment: {
        id: '900', description: '<p>Enviar&nbsp;informe de avance</p>', delivery_date: '2026-12-01',
        finished_date: null, state: '1', priority: '0', user_id: '11', contac_id: '3406',
        created: '2026-11-25 10:00:00', modified: '2026-11-25 10:00:00',
        ...overrides,
    },
    User: { email: 'Victor@strategee.us' },
    Contac: { id: '3406', number: '57' },
    Client: { name: 'Las Américas' },
    Project: { name: 'App Experience' },
});

function buildTasksService(boards: Board[], taskRepo = memoryRepo<Task>('t')) {
    const lists = { save: jest.fn(async (l: any) => l), delete: jest.fn() };
    const minutes = { setCommitmentState: jest.fn().mockResolvedValue({ modified: '2026-11-26 10:00:00' }) };
    const users = { findOne: jest.fn().mockResolvedValue({ id: 'u1', email: 'victor@strategee.us' }) };
    const events = { emit: jest.fn() };
    const boardsService = fakeBoards(boards, taskRepo);
    const service = new TasksService(taskRepo as any, lists as any, boardsService as any, users as any, minutes as any, events as any);
    return { service, taskRepo, minutes, events, boardsService, lists };
}

describe('TasksService (tableros y listas)', () => {
    it('crea tareas manuales en la primera lista de pendientes, asignadas a quien las crea', async () => {
        const { service, taskRepo } = buildTasksService([makeBoard('b1')]);
        await service.create('u1', { boardId: 'b1', title: 'Preparar propuesta' });
        await service.create('u1', { boardId: 'b1', title: 'Segunda' });
        expect(taskRepo.rows.map((t) => [t.listId, t.position, t.assigneeUserId, t.status])).toEqual([
            ['b1-todo', 0, 'u1', TaskStatus.PENDING],
            ['b1-todo', 1, 'u1', TaskStatus.PENDING],
        ]);
    });

    it('no permite tareas manuales en el tablero Recapmeeting', async () => {
        const { service } = buildTasksService([makeBoard('r1', BoardType.RECAPMEETING)]);
        await expect(service.create('u1', { boardId: 'r1', title: 'x' })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('el responsable debe tener acceso al tablero', async () => {
        const { service } = buildTasksService([makeBoard('b1')]);
        await expect(service.create('u1', { boardId: 'b1', title: 'x', assigneeUserId: 'extraño' }))
            .rejects.toThrow('El responsable debe tener acceso al tablero');
    });

    it('mover a la lista de hechas termina el compromiso en recapmeeting; entre pendientes no lo toca', async () => {
        const board = makeBoard('r1', BoardType.RECAPMEETING);
        const { service, taskRepo, minutes } = buildTasksService([board]);
        const task = await taskRepo.save(taskRepo.create({
            boardId: 'r1', listId: 'r1-todo', position: 0, assigneeUserId: 'u1', title: 'Compromiso',
            status: TaskStatus.PENDING, source: TaskSource.RECAPMEETING, recapCommitmentId: 900,
        })) as Task;

        await service.update('u1', task.id, { listId: 'r1-doing' });
        expect(minutes.setCommitmentState).not.toHaveBeenCalled();

        await service.update('u1', task.id, { listId: 'r1-done' });
        expect(minutes.setCommitmentState).toHaveBeenCalledWith('victor@strategee.us', '900', true);
        expect(taskRepo.rows[0]).toMatchObject({ listId: 'r1-done', status: TaskStatus.DONE, recapModifiedAt: '2026-11-26 10:00:00' });

        await service.update('u1', task.id, { listId: 'r1-todo' });
        expect(minutes.setCommitmentState).toHaveBeenLastCalledWith('victor@strategee.us', '900', false);
        expect(taskRepo.rows[0]).toMatchObject({ status: TaskStatus.PENDING, completedAt: null });
    });

    it('si recapmeeting rechaza el cambio, la tarea no se mueve', async () => {
        const { service, taskRepo, minutes } = buildTasksService([makeBoard('r1', BoardType.RECAPMEETING)]);
        const task = await taskRepo.save(taskRepo.create({
            boardId: 'r1', listId: 'r1-todo', position: 0, assigneeUserId: 'u1', title: 'C',
            status: TaskStatus.PENDING, source: TaskSource.RECAPMEETING, recapCommitmentId: 900,
        })) as Task;
        minutes.setCommitmentState.mockRejectedValueOnce(new Error('recapmeeting caído'));
        await expect(service.update('u1', task.id, { listId: 'r1-done' })).rejects.toThrow('recapmeeting caído');
        expect(taskRepo.rows[0]).toMatchObject({ listId: 'r1-todo', status: TaskStatus.PENDING });
    });

    it('reordena dentro de la lista según la posición pedida', async () => {
        const { service, taskRepo } = buildTasksService([makeBoard('b1')]);
        const a = await service.create('u1', { boardId: 'b1', title: 'A' });
        await service.create('u1', { boardId: 'b1', title: 'B' });
        await service.create('u1', { boardId: 'b1', title: 'C' });
        await service.update('u1', a.id, { position: 2 });
        const order = [...taskRepo.rows].sort((x, y) => x.position - y.position).map((t) => t.title);
        expect(order).toEqual(['B', 'C', 'A']);
    });

    it('las tareas de un acta no se editan ni se borran, solo se mueven', async () => {
        const { service, taskRepo } = buildTasksService([makeBoard('r1', BoardType.RECAPMEETING)]);
        const task = await taskRepo.save(taskRepo.create({
            boardId: 'r1', listId: 'r1-todo', assigneeUserId: 'u1', title: 'C', status: TaskStatus.PENDING, source: TaskSource.RECAPMEETING,
        })) as Task;
        await expect(service.update('u1', task.id, { title: 'Otro' })).rejects.toBeInstanceOf(BadRequestException);
        await expect(service.remove('u1', task.id)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('cambiar de responsable quita la tarea del Google Tasks del anterior', async () => {
        const { service, taskRepo, events } = buildTasksService([makeBoard('b1')]);
        const task = await service.create('u1', { boardId: 'b1', title: 'A' });
        taskRepo.rows[0].googleTaskId = 'g1';
        await service.update('u1', task.id, { assigneeUserId: 'u2' });
        expect(events.emit).toHaveBeenCalledWith(TASK_REMOVED_EVENT, { userId: 'u1', boardId: 'b1', googleTaskId: 'g1' });
        expect(taskRepo.rows[0]).toMatchObject({ assigneeUserId: 'u2', googleTaskId: null, googleSyncPending: true });
    });

    it('al borrar una lista con tareas exige destino y las mueve (cambiando su estado)', async () => {
        const board = makeBoard('b1');
        const { service, taskRepo, lists } = buildTasksService([board]);
        await service.create('u1', { boardId: 'b1', title: 'A' });
        await expect(service.deleteList('u1', 'b1-todo')).rejects.toThrow('indica a qué lista moverlas');
        await service.deleteList('u1', 'b1-todo', 'b1-done');
        expect(taskRepo.rows[0]).toMatchObject({ listId: 'b1-done', status: TaskStatus.DONE });
        expect(lists.delete).toHaveBeenCalledWith('b1-todo');
    });

    it('marcar una lista como "hechas" completa sus tareas; en Recapmeeting exige que esté vacía', async () => {
        const custom = makeBoard('b1');
        const { service, taskRepo } = buildTasksService([custom, makeBoard('r1', BoardType.RECAPMEETING)]);
        await service.create('u1', { boardId: 'b1', title: 'A' });
        await service.setListDone('u1', 'b1-todo', true);
        expect(taskRepo.rows[0].status).toBe(TaskStatus.DONE);

        await taskRepo.save(taskRepo.create({ boardId: 'r1', listId: 'r1-doing', assigneeUserId: 'u1', title: 'C', status: TaskStatus.PENDING, source: TaskSource.RECAPMEETING }));
        await expect(service.setListDone('u1', 'r1-doing', true)).rejects.toThrow('primero mueve los compromisos');
    });
});

describe('TasksRecapSyncService', () => {
    let boards: Board[];
    let taskRepo: ReturnType<typeof memoryRepo<Task>>;
    let state: { findOne: jest.Mock; save: jest.Mock };
    let minutes: { listCommitments: jest.Mock };
    let events: { emit: jest.Mock };
    let service: TasksRecapSyncService;

    beforeEach(() => {
        boards = [];
        const built = buildTasksService(boards);
        taskRepo = built.taskRepo;
        state = { findOne: jest.fn().mockResolvedValue({ value: '2026-11-24 00:00:00' }), save: jest.fn() };
        minutes = { listCommitments: jest.fn() };
        events = { emit: jest.fn() };
        const users = { find: jest.fn().mockResolvedValue([{ id: 'u1', email: 'victor@strategee.us' }, { id: 'u2', email: 'otra@strategee.us' }]) };
        service = new TasksRecapSyncService(
            taskRepo as any, state as any, users as any, minutes as any, built.boardsService as any, built.service, events as any,
        );
    });

    it('crea la tarea en la primera lista del tablero Recapmeeting del responsable', async () => {
        minutes.listCommitments.mockResolvedValueOnce([commitment()]);
        const result = await service.sync();

        expect(minutes.listCommitments).toHaveBeenCalledWith('2026-11-24 00:00:00', 1);
        expect(result).toEqual({ created: 1, updated: 0, skippedNoUser: 0 });
        expect(taskRepo.rows[0]).toMatchObject({
            boardId: 'recap-u1', listId: 'recap-u1-todo', assigneeUserId: 'u1', title: 'Enviar informe de avance',
            dueDate: '2026-12-01', status: TaskStatus.PENDING, source: TaskSource.RECAPMEETING, recapCommitmentId: 900,
            recapMinuteNumber: '57', googleSyncPending: true,
        });
        expect(state.save).toHaveBeenCalledWith({ key: 'recap_commitments_modified', value: '2026-11-25 10:00:00' });
        expect(events.emit).toHaveBeenCalledWith(TASK_CHANGED_EVENT, { taskId: taskRepo.rows[0].id });
    });

    it('no crea tareas para compromisos ya terminados ni para responsables sin usuario', async () => {
        minutes.listCommitments.mockResolvedValueOnce([
            commitment({ state: '2', finished_date: '2021-04-09' }),
            { ...commitment({ id: '901' }), User: { email: 'externo@cliente.com' } },
        ]);
        expect(await service.sync()).toEqual({ created: 0, updated: 0, skippedNoUser: 1 });
        expect(taskRepo.rows).toHaveLength(0);
    });

    it('terminado en recapmeeting: pasa a la lista de hechas sin volver a avisar a recapmeeting', async () => {
        minutes.listCommitments.mockResolvedValueOnce([commitment()]);
        await service.sync();
        minutes.listCommitments.mockResolvedValueOnce([commitment({ state: '2', finished_date: '2026-11-26', modified: '2026-11-26 09:00:00' })]);
        expect((await service.sync())?.updated).toBe(1);
        expect(taskRepo.rows[0]).toMatchObject({ listId: 'recap-u1-done', status: TaskStatus.DONE });
        expect(taskRepo.rows[0].completedAt).toBeInstanceOf(Date);
    });

    it('sigue pendiente en recapmeeting: respeta la lista local (por ejemplo, En progreso)', async () => {
        minutes.listCommitments.mockResolvedValueOnce([commitment()]);
        await service.sync();
        taskRepo.rows[0].listId = 'recap-u1-doing';
        minutes.listCommitments.mockResolvedValueOnce([commitment({ delivery_date: '2026-12-10', modified: '2026-11-26 00:00:00' })]);
        await service.sync();
        expect(taskRepo.rows[0]).toMatchObject({ listId: 'recap-u1-doing', dueDate: '2026-12-10' });
    });

    it('al cambiar de responsable pasa a su tablero y sale del Google del anterior', async () => {
        minutes.listCommitments.mockResolvedValueOnce([commitment()]);
        await service.sync();
        taskRepo.rows[0].googleTaskId = 'g1';
        minutes.listCommitments.mockResolvedValueOnce([{ ...commitment({ modified: '2026-11-26 00:00:00' }), User: { email: 'otra@strategee.us' } }]);
        await service.sync();
        expect(events.emit).toHaveBeenCalledWith(TASK_REMOVED_EVENT, { userId: 'u1', boardId: 'recap-u1', googleTaskId: 'g1' });
        expect(taskRepo.rows[0]).toMatchObject({ assigneeUserId: 'u2', boardId: 'recap-u2', listId: 'recap-u2-todo', googleTaskId: null });
    });

    it('recorre todas las páginas y la sincronización completa ignora el cursor', async () => {
        const page1 = Array.from({ length: 100 }, (_, i) => commitment({ id: String(i + 1) }));
        minutes.listCommitments.mockResolvedValueOnce(page1).mockResolvedValueOnce([commitment({ id: '500', modified: '2026-11-27 08:00:00' })]);
        expect((await service.sync(true))?.created).toBe(101);
        expect(minutes.listCommitments).toHaveBeenNthCalledWith(1, null, 1);
        expect(minutes.listCommitments).toHaveBeenNthCalledWith(2, null, 2);
    });

    it('convierte el HTML del compromiso en texto', () => {
        expect(toPlainText('<p>Revisar&nbsp;el <b>acta</b> &amp; enviar</p><p>Segunda l&iacute;nea</p>'))
            .toBe('Revisar el acta & enviar\nSegunda línea');
    });
});

describe('TasksGoogleSyncService', () => {
    let boards: Board[];
    let taskRepo: ReturnType<typeof memoryRepo<Task>>;
    let mappings: ReturnType<typeof memoryRepo<any>>;
    let google: Record<string, jest.Mock>;
    let tasksService: TasksService;
    let minutes: { setCommitmentState: jest.Mock };
    let events: { emit: jest.Mock };
    let service: TasksGoogleSyncService;

    beforeEach(() => {
        boards = [makeBoard('b1'), makeBoard('r1', BoardType.RECAPMEETING)];
        const built = buildTasksService(boards);
        taskRepo = built.taskRepo;
        tasksService = built.service;
        minutes = built.minutes;
        mappings = memoryRepo<any>('m');
        google = {
            connectedUserIds: jest.fn().mockResolvedValue(['u1']),
            isConnected: jest.fn().mockResolvedValue(true),
            listExists: jest.fn().mockResolvedValue(true),
            createList: jest.fn().mockResolvedValue('glist-new'),
            renameList: jest.fn(),
            deleteList: jest.fn(),
            insert: jest.fn().mockResolvedValue({ id: 'g-new', updated: '2026-11-26T10:00:00.000Z' }),
            patch: jest.fn().mockResolvedValue({ id: 'g1', updated: '2026-11-26T10:00:00.000Z' }),
            remove: jest.fn(),
            listUpdated: jest.fn().mockResolvedValue([]),
        };
        const boardRepo = { findOne: jest.fn(async ({ where }: any) => boards.find((b) => b.id === where.id) ?? null) };
        events = { emit: jest.fn() };
        service = new TasksGoogleSyncService(
            taskRepo as any, boardRepo as any, mappings as any, google as any, built.boardsService as any, tasksService, events as any,
        );
    });

    const addTask = (data: Partial<Task>) => taskRepo.save(taskRepo.create({
        boardId: 'b1', listId: 'b1-todo', position: 0, assigneeUserId: 'u1', title: 'Tarea',
        status: TaskStatus.PENDING, source: TaskSource.MANUAL, googleSyncPending: false, googleTaskId: null, googleUpdatedAt: null,
        ...data,
    })) as Promise<Task>;

    it('crea una lista de Google por tablero (con su nombre) y envía la tarea con el origen del acta', async () => {
        await addTask({
            boardId: 'r1', listId: 'r1-todo', source: TaskSource.RECAPMEETING, title: 'Enviar informe', dueDate: '2026-12-01',
            googleSyncPending: true, recapMinuteNumber: '57', recapClientName: 'Las Américas', recapProjectName: 'App',
        });
        await service.pushPending();

        expect(google.createList).toHaveBeenCalledWith('u1', 'r1');
        expect(mappings.rows[0]).toMatchObject({ userId: 'u1', boardId: 'r1', googleListId: 'glist-new' });
        expect(google.insert).toHaveBeenCalledWith('u1', 'glist-new', {
            title: 'Enviar informe', notes: 'Acta #57 · Las Américas · App', dueDate: '2026-12-01', done: false,
        });
        expect(taskRepo.rows[0]).toMatchObject({ googleTaskId: 'g-new', googleSyncPending: false });
    });

    it('reutiliza la lista existente y recrea la tarea si fue borrada en Google', async () => {
        await mappings.save({ userId: 'u1', boardId: 'b1', googleListId: 'glist-b1', pulledAt: null });
        await addTask({ googleTaskId: 'g-old', googleSyncPending: true });
        google.patch.mockRejectedValueOnce(new GoogleTasksError(404, 'not found'));
        await service.pushPending();
        expect(google.createList).not.toHaveBeenCalled();
        expect(google.insert).toHaveBeenCalledWith('u1', 'glist-b1', expect.any(Object));
        expect(taskRepo.rows[0].googleTaskId).toBe('g-new');
    });

    it('completar en Google mueve la tarea a la lista de hechas y termina el compromiso', async () => {
        const mapping = await mappings.save({ userId: 'u1', boardId: 'r1', googleListId: 'glist-r1', pulledAt: '2026-11-25T00:00:00.000Z' });
        await addTask({
            boardId: 'r1', listId: 'r1-doing', source: TaskSource.RECAPMEETING, recapCommitmentId: 900,
            googleTaskId: 'g1', googleUpdatedAt: '2026-11-25T10:00:00.000Z',
        });
        google.listUpdated.mockResolvedValueOnce([{ id: 'g1', title: 'Tarea', status: 'completed', updated: '2026-11-26T09:00:00.000Z' }]);
        await service.pullList(mapping);

        expect(minutes.setCommitmentState).toHaveBeenCalledWith('victor@strategee.us', '900', true);
        expect(taskRepo.rows[0]).toMatchObject({ listId: 'r1-done', status: TaskStatus.DONE, googleUpdatedAt: '2026-11-26T09:00:00.000Z' });
        expect(mappings.rows[0].pulledAt).not.toBe('2026-11-25T00:00:00.000Z');
    });

    it('si recapmeeting rechaza el estado venido de Google, lo revierte en Google', async () => {
        const mapping = await mappings.save({ userId: 'u1', boardId: 'r1', googleListId: 'glist-r1', pulledAt: null });
        await addTask({
            boardId: 'r1', listId: 'r1-todo', source: TaskSource.RECAPMEETING, recapCommitmentId: 900,
            googleTaskId: 'g1', googleUpdatedAt: '2026-11-25T10:00:00.000Z',
        });
        minutes.setCommitmentState.mockRejectedValueOnce(new Error('no'));
        google.listUpdated.mockResolvedValueOnce([{ id: 'g1', title: 'Tarea', status: 'completed', updated: '2026-11-26T09:00:00.000Z' }]);
        await service.pullList(mapping);
        expect(taskRepo.rows[0]).toMatchObject({ listId: 'r1-todo', status: TaskStatus.PENDING, googleSyncPending: true });
        expect(events.emit).toHaveBeenCalledWith(TASK_CHANGED_EVENT, { taskId: taskRepo.rows[0].id });
    });

    it('una tarea en "En progreso" sigue ahí si en Google está sin completar', async () => {
        const mapping = await mappings.save({ userId: 'u1', boardId: 'b1', googleListId: 'glist-b1', pulledAt: null });
        await addTask({ listId: 'b1-doing', googleTaskId: 'g1', googleUpdatedAt: '2026-11-25T10:00:00.000Z' });
        google.listUpdated.mockResolvedValueOnce([{ id: 'g1', title: 'Tarea', status: 'needsAction', updated: '2026-11-26T09:00:00.000Z' }]);
        await service.pullList(mapping);
        expect(taskRepo.rows[0].listId).toBe('b1-doing');
    });

    it('crea una tarea manual si se agregó en la lista de Google de un tablero personalizado (no en Recapmeeting)', async () => {
        const custom = await mappings.save({ userId: 'u1', boardId: 'b1', googleListId: 'glist-b1', pulledAt: null });
        const recap = await mappings.save({ userId: 'u1', boardId: 'r1', googleListId: 'glist-r1', pulledAt: null });
        google.listUpdated
            .mockResolvedValueOnce([{ id: 'g9', title: 'Desde Google', status: 'needsAction', updated: '2026-11-26T09:00:00.000Z' }])
            .mockResolvedValueOnce([{ id: 'g10', title: 'En recap', status: 'needsAction', updated: '2026-11-26T09:00:00.000Z' }]);
        await service.pullList(custom);
        await service.pullList(recap);
        expect(taskRepo.rows).toHaveLength(1);
        expect(taskRepo.rows[0]).toMatchObject({ boardId: 'b1', listId: 'b1-todo', title: 'Desde Google', googleTaskId: 'g9' });
    });

    it('borrar en Google elimina la tarea manual pero solo desvincula la de un acta', async () => {
        const mapping = await mappings.save({ userId: 'u1', boardId: 'b1', googleListId: 'glist-b1', pulledAt: null });
        await addTask({ googleTaskId: 'g1', googleUpdatedAt: '2026-11-25T10:00:00.000Z' });
        await addTask({ source: TaskSource.RECAPMEETING, googleTaskId: 'g2', googleUpdatedAt: '2026-11-25T10:00:00.000Z' });
        google.listUpdated.mockResolvedValueOnce([
            { id: 'g1', deleted: true, status: 'needsAction', updated: '2026-11-26T09:00:00.000Z' },
            { id: 'g2', deleted: true, status: 'needsAction', updated: '2026-11-26T09:00:00.000Z' },
        ]);
        await service.pullList(mapping);
        expect(taskRepo.rows).toHaveLength(1);
        expect(taskRepo.rows[0]).toMatchObject({ source: TaskSource.RECAPMEETING, googleTaskId: null });
    });

    it('al renombrar o borrar un tablero, renombra o borra sus listas en Google', async () => {
        await mappings.save({ userId: 'u1', boardId: 'b1', googleListId: 'glist-b1', pulledAt: null });
        await service.onBoardRenamed({ boardId: 'b1', name: 'Marketing' });
        expect(google.renameList).toHaveBeenCalledWith('u1', 'glist-b1', 'Marketing');
        await service.onBoardDeleted({ lists: [{ userId: 'u1', googleListId: 'glist-b1' }] });
        expect(google.deleteList).toHaveBeenCalledWith('u1', 'glist-b1');
    });
});
