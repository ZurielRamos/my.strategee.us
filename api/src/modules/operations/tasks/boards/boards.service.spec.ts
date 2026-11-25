import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { BoardsService } from './boards.service';
import { Board, BoardType } from '../entities/board.entity';
import { BoardList } from '../entities/board-list.entity';
import { TaskSource, TaskStatus } from '../entities/task.entity';

function repo(rows: any[] = []) {
    let seq = 0;
    const matches = (row: any, where: any) => Object.entries(where ?? {}).every(([k, v]: [string, any]) =>
        v && typeof v === 'object' && '_type' in v ? (v._type === 'isNull' ? row[k] == null : true) : row[k] === v);
    return {
        rows,
        create: (d: any) => ({ ...d }),
        save: jest.fn(async (e: any) => {
            for (const item of Array.isArray(e) ? e : [e]) {
                if (!item.id) { item.id = `x${++seq}`; item.createdAt = new Date(2026, 0, seq); rows.push(item); }
            }
            return e;
        }),
        findOne: jest.fn(async ({ where }: any) => rows.find((r) => matches(r, where)) ?? null),
        find: jest.fn(async ({ where }: any = {}) => rows.filter((r) => matches(r, where))),
        count: jest.fn(async () => 0),
        delete: jest.fn(),
        remove: jest.fn(),
    };
}

describe('BoardsService', () => {
    let boards: ReturnType<typeof repo>;
    let lists: ReturnType<typeof repo>;
    let shares: ReturnType<typeof repo>;
    let tasks: ReturnType<typeof repo>;
    let users: ReturnType<typeof repo>;
    let employees: ReturnType<typeof repo>;
    let departments: ReturnType<typeof repo>;
    let service: BoardsService;

    beforeEach(() => {
        boards = repo(); lists = repo(); shares = repo(); tasks = repo();
        users = repo([{ id: 'u1', email: 'v@strategee.us', isActive: true, employee: { departmentId: 'dep-1' } }]);
        employees = repo(); departments = repo();
        service = new BoardsService(
            boards as any, lists as any, shares as any, tasks as any, users as any, employees as any, departments as any,
            repo() as any, { emit: jest.fn() } as any,
        );
    });

    it('crea el tablero Recapmeeting una sola vez, con Pendiente, En progreso y Hecha', async () => {
        const first = await service.ensureRecapBoard('u1');
        const second = await service.ensureRecapBoard('u1');
        expect(second.id).toBe(first.id);
        expect(first).toMatchObject({ name: 'Recapmeeting', type: BoardType.RECAPMEETING, ownerUserId: 'u1' });
        expect(lists.rows.map((l) => [l.name, l.isDone, l.position])).toEqual([
            ['Pendiente', false, 0], ['En progreso', false, 1], ['Hecha', true, 2],
        ]);
    });

    it('ubica las tareas anteriores a los tableros: compromisos en Recapmeeting y manuales en "Mis tareas"', async () => {
        tasks.rows.push(
            { id: 't1', assigneeUserId: 'u1', boardId: null, source: TaskSource.RECAPMEETING, status: 'in_progress', googleTaskId: 'g1' },
            { id: 't2', assigneeUserId: 'u1', boardId: null, source: TaskSource.MANUAL, status: TaskStatus.DONE },
        );
        const recap = await service.ensureUserSetup('u1');
        const mine = boards.rows.find((b) => b.name === 'Mis tareas');
        const listName = (id: string) => lists.rows.find((l) => l.id === id)?.name;

        expect(tasks.rows[0]).toMatchObject({ boardId: recap.id, status: TaskStatus.PENDING, googleTaskId: null, googleSyncPending: true });
        expect(listName(tasks.rows[0].listId)).toBe('En progreso');
        expect(tasks.rows[1]).toMatchObject({ boardId: mine.id, status: TaskStatus.DONE });
        expect(listName(tasks.rows[1].listId)).toBe('Hecha');
    });

    it('Recapmeeting debe conservar una lista de pendientes y una de hechas; los demás, al menos una lista', () => {
        const recap = { type: BoardType.RECAPMEETING } as Board;
        const custom = { type: BoardType.CUSTOM } as Board;
        const todo = { isDone: false } as BoardList;
        const done = { isDone: true } as BoardList;
        expect(() => service.assertListsValid(recap, [todo])).toThrow('lista de tareas hechas');
        expect(() => service.assertListsValid(recap, [done])).toThrow('lista de tareas pendientes');
        expect(() => service.assertListsValid(recap, [todo, done])).not.toThrow();
        expect(() => service.assertListsValid(custom, [])).toThrow(BadRequestException);
        expect(() => service.assertListsValid(custom, [done])).not.toThrow();
    });

    it('el tablero Recapmeeting no se comparte, ni se renombra, ni se elimina', async () => {
        const recap = await service.ensureRecapBoard('u1');
        jest.spyOn(service, 'getAccess').mockResolvedValue({ board: recap, isOwner: true });
        await expect(service.setShares('u1', recap.id, ['u2'], [])).rejects.toThrow('es personal');
        await expect(service.renameBoard('u1', recap.id, 'Otro')).rejects.toThrow('no se puede renombrar');
        await expect(service.deleteBoard('u1', recap.id)).rejects.toThrow('no se puede eliminar');
    });

    it('solo el dueño administra el tablero', async () => {
        jest.spyOn(service, 'getAccess').mockResolvedValue({ board: { id: 'b1', type: BoardType.CUSTOM } as Board, isOwner: false });
        await expect(service.getOwned('u2', 'b1')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('da acceso por usuario o por departamento, y niega a los demás', async () => {
        boards.rows.push({ id: 'b1', ownerUserId: 'owner', type: BoardType.CUSTOM, lists: [], shares: [{ userId: 'u9', departmentId: null }, { userId: null, departmentId: 'dep-1' }] });
        boards.findOne.mockImplementation(async () => boards.rows[0]);
        await expect(service.getAccess('u1', 'b1')).resolves.toMatchObject({ isOwner: false }); // por su departamento
        users.rows.push({ id: 'u3', email: 'x@strategee.us', isActive: true, employee: { departmentId: 'dep-2' } });
        await expect(service.getAccess('u3', 'b1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('los miembros incluyen al dueño, a los usuarios compartidos y a los empleados de los departamentos', async () => {
        employees.find.mockResolvedValue([{ user: { id: 'u5' } }, { user: null }]);
        const ids = await service.memberIds({ ownerUserId: 'owner', shares: [{ userId: 'u9' }, { departmentId: 'dep-1' }] } as any);
        expect(ids.sort()).toEqual(['owner', 'u5', 'u9']);
    });
});
