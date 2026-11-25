import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { In, IsNull, Repository } from 'typeorm';
import { User } from '@modules/iam/users/entities/user.entity';
import { Employee } from '@modules/core/employees/entities/employee.entity';
import { Department } from '@modules/organization/departments/entities/department.entity';
import { Board, BoardType, RECAP_BOARD_NAME } from '../entities/board.entity';
import { BoardList } from '../entities/board-list.entity';
import { BoardShare } from '../entities/board-share.entity';
import { Task, TaskSource, TaskStatus } from '../entities/task.entity';
import { GoogleTaskList } from '../entities/google-task-list.entity';
import {
    BOARD_DELETED_EVENT, BOARD_RENAMED_EVENT, BoardDeletedPayload, BoardRenamedPayload,
} from '../tasks.events';

export const DEFAULT_LISTS: ReadonlyArray<{ name: string; isDone: boolean }> = [
    { name: 'Pendiente', isDone: false },
    { name: 'En progreso', isDone: false },
    { name: 'Hecha', isDone: true },
];
/** Tablero donde quedan las tareas manuales creadas antes de que existieran los tableros. */
const LEGACY_MANUAL_BOARD_NAME = 'Mis tareas';
const LEGACY_IN_PROGRESS = 'in_progress';

export interface BoardMember {
    id: string;
    name: string;
    email: string;
}

export interface BoardAccess {
    board: Board;
    isOwner: boolean;
}

@Injectable()
export class BoardsService {
    constructor(
        @InjectRepository(Board) private readonly boardRepository: Repository<Board>,
        @InjectRepository(BoardList) private readonly listRepository: Repository<BoardList>,
        @InjectRepository(BoardShare) private readonly shareRepository: Repository<BoardShare>,
        @InjectRepository(Task) private readonly taskRepository: Repository<Task>,
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        @InjectRepository(Employee) private readonly employeeRepository: Repository<Employee>,
        @InjectRepository(Department) private readonly departmentRepository: Repository<Department>,
        @InjectRepository(GoogleTaskList) private readonly googleListRepository: Repository<GoogleTaskList>,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    // --- Tableros del usuario ---

    /** Tableros a los que el usuario tiene acceso (Recapmeeting primero), con sus listas. */
    async listBoards(userId: string) {
        await this.ensureUserSetup(userId);
        const boards = await this.accessibleBoards(userId);
        const owners = await this.userRepository.find({
            where: { id: In([...new Set(boards.map((b) => b.ownerUserId))]) },
            relations: ['employee'],
        });
        const ownerNames = new Map(owners.map((u) => [u.id, this.displayName(u)]));

        return boards
            .sort((a, b) =>
                Number(b.type === BoardType.RECAPMEETING) - Number(a.type === BoardType.RECAPMEETING)
                || a.createdAt.getTime() - b.createdAt.getTime())
            .map((board) => ({
                id: board.id,
                name: board.name,
                type: board.type,
                isOwner: board.ownerUserId === userId,
                ownerName: ownerNames.get(board.ownerUserId) ?? '',
                isShared: board.shares.length > 0,
                lists: this.sortLists(board.lists),
                shares: board.ownerUserId === userId
                    ? board.shares.map((s) => ({ id: s.id, userId: s.userId, departmentId: s.departmentId }))
                    : [],
            }));
    }

    async createBoard(userId: string, name: string): Promise<Board> {
        const board = await this.boardRepository.save(this.boardRepository.create({
            ownerUserId: userId, name, type: BoardType.CUSTOM,
        }));
        board.lists = await this.createDefaultLists(board.id);
        board.shares = [];
        return board;
    }

    async renameBoard(userId: string, boardId: string, name: string): Promise<Board> {
        const { board } = await this.getOwned(userId, boardId);
        if (board.type === BoardType.RECAPMEETING) {
            throw new BadRequestException('El tablero Recapmeeting no se puede renombrar');
        }
        board.name = name;
        await this.boardRepository.save(board);
        this.eventEmitter.emit(BOARD_RENAMED_EVENT, { boardId, name } satisfies BoardRenamedPayload);
        return board;
    }

    /** Borra el tablero con sus listas y tareas (manuales), y sus listas en Google Tasks. */
    async deleteBoard(userId: string, boardId: string): Promise<void> {
        const { board } = await this.getOwned(userId, boardId);
        if (board.type === BoardType.RECAPMEETING) {
            throw new BadRequestException('El tablero Recapmeeting no se puede eliminar');
        }
        const googleLists = await this.googleListRepository.find({ where: { boardId } });
        await this.taskRepository.delete({ boardId });
        await this.boardRepository.remove(board);
        this.eventEmitter.emit(BOARD_DELETED_EVENT, {
            lists: googleLists.map((l) => ({ userId: l.userId, googleListId: l.googleListId })),
        } satisfies BoardDeletedPayload);
    }

    /** Reemplaza con quién se comparte el tablero (empleados y departamentos). */
    async setShares(userId: string, boardId: string, userIds: string[], departmentIds: string[]) {
        const { board } = await this.getOwned(userId, boardId);
        if (board.type === BoardType.RECAPMEETING) {
            throw new BadRequestException('El tablero Recapmeeting es personal y no se puede compartir');
        }
        const uniqueUsers = [...new Set(userIds)].filter((id) => id !== userId);
        const uniqueDepartments = [...new Set(departmentIds)];
        if (uniqueUsers.length) {
            const found = await this.userRepository.count({ where: { id: In(uniqueUsers), isActive: true } });
            if (found !== uniqueUsers.length) throw new BadRequestException('Alguno de los usuarios no existe o está inactivo');
        }
        if (uniqueDepartments.length) {
            const found = await this.departmentRepository.count({ where: { id: In(uniqueDepartments) } });
            if (found !== uniqueDepartments.length) throw new BadRequestException('Alguno de los departamentos no existe');
        }
        await this.shareRepository.delete({ boardId });
        await this.shareRepository.save([
            ...uniqueUsers.map((id) => this.shareRepository.create({ boardId, userId: id, departmentId: null })),
            ...uniqueDepartments.map((id) => this.shareRepository.create({ boardId, userId: null, departmentId: id })),
        ]);
        return this.shareRepository.find({ where: { boardId } });
    }

    /** Opciones para compartir: empleados activos con usuario y departamentos. */
    async shareOptions(userId: string) {
        const users = await this.userRepository.find({ where: { isActive: true }, relations: ['employee'] });
        const departments = await this.departmentRepository.find({ order: { name: 'ASC' } });
        return {
            users: users
                .filter((u) => u.id !== userId)
                .map((u) => ({ id: u.id, name: this.displayName(u), email: u.email }))
                .sort((a, b) => a.name.localeCompare(b.name, 'es')),
            departments: departments.map((d) => ({ id: d.id, name: d.name })),
        };
    }

    /** Personas con acceso al tablero (posibles responsables de sus tareas). */
    async members(userId: string, boardId: string): Promise<BoardMember[]> {
        const { board } = await this.getAccess(userId, boardId);
        const ids = await this.memberIds(board);
        const users = await this.userRepository.find({ where: { id: In(ids), isActive: true }, relations: ['employee'] });
        return users
            .map((u) => ({ id: u.id, name: this.displayName(u), email: u.email }))
            .sort((a, b) => a.name.localeCompare(b.name, 'es'));
    }

    async memberIds(board: Board): Promise<string[]> {
        const shares = board.shares ?? await this.shareRepository.find({ where: { boardId: board.id } });
        const ids = new Set<string>([board.ownerUserId]);
        shares.forEach((s) => s.userId && ids.add(s.userId));
        const departmentIds = shares.map((s) => s.departmentId).filter((id): id is string => !!id);
        if (departmentIds.length) {
            const employees = await this.employeeRepository.find({
                where: { departmentId: In(departmentIds), isActive: true },
                relations: ['user'],
            });
            employees.forEach((e) => e.user?.id && ids.add(e.user.id));
        }
        return [...ids];
    }

    // --- Listas ---

    async createList(userId: string, boardId: string, name: string, isDone: boolean): Promise<BoardList> {
        await this.getOwned(userId, boardId);
        const last = await this.listRepository.findOne({ where: { boardId }, order: { position: 'DESC' } });
        return this.listRepository.save(this.listRepository.create({
            boardId, name, isDone, position: (last?.position ?? -1) + 1,
        }));
    }

    async renameList(userId: string, listId: string, name: string): Promise<BoardList> {
        const list = await this.getOwnedList(userId, listId);
        list.name = name;
        return this.listRepository.save(list);
    }

    /** Mueve la lista a la posición indicada (0 = primera) y renumera las demás. */
    async moveList(userId: string, listId: string, position: number): Promise<BoardList[]> {
        const list = await this.getOwnedList(userId, listId);
        const lists = this.sortLists(await this.listRepository.find({ where: { boardId: list.boardId } }))
            .filter((l) => l.id !== list.id);
        lists.splice(Math.max(0, Math.min(position, lists.length)), 0, list);
        lists.forEach((l, index) => (l.position = index));
        return this.listRepository.save(lists);
    }

    /**
     * Comprueba que el tablero conserve las listas mínimas tras un cambio:
     * siempre al menos una lista, y en Recapmeeting una de pendientes y una de hechas.
     */
    assertListsValid(board: Board, lists: BoardList[]) {
        if (lists.length === 0) {
            throw new BadRequestException('El tablero debe tener al menos una lista');
        }
        if (board.type === BoardType.RECAPMEETING) {
            if (!lists.some((l) => l.isDone)) {
                throw new BadRequestException('El tablero Recapmeeting debe tener al menos una lista de tareas hechas');
            }
            if (!lists.some((l) => !l.isDone)) {
                throw new BadRequestException('El tablero Recapmeeting debe tener al menos una lista de tareas pendientes');
            }
        }
    }

    /** Primera lista (por posición) de tareas hechas o pendientes; si no hay, la primera lista. */
    async firstList(boardId: string, done: boolean): Promise<BoardList> {
        const lists = this.sortLists(await this.listRepository.find({ where: { boardId } }));
        const list = lists.find((l) => l.isDone === done) ?? lists[0];
        if (!list) throw new BadRequestException('El tablero no tiene listas');
        return list;
    }

    async nextPosition(listId: string): Promise<number> {
        const last = await this.taskRepository.findOne({ where: { listId }, order: { position: 'DESC' } });
        return (last?.position ?? -1) + 1;
    }

    // --- Acceso ---

    async getAccess(userId: string, boardId: string): Promise<BoardAccess> {
        const board = await this.boardRepository.findOne({ where: { id: boardId }, relations: ['lists', 'shares'] });
        if (!board) throw new NotFoundException('Tablero no encontrado');
        if (board.ownerUserId === userId) return { board, isOwner: true };
        const departmentId = await this.userDepartmentId(userId);
        const shared = board.shares.some((s) => s.userId === userId || (!!departmentId && s.departmentId === departmentId));
        if (!shared) throw new NotFoundException('Tablero no encontrado');
        return { board, isOwner: false };
    }

    async getOwned(userId: string, boardId: string): Promise<BoardAccess> {
        const access = await this.getAccess(userId, boardId);
        if (!access.isOwner) throw new ForbiddenException('Solo el dueño del tablero puede hacer este cambio');
        return access;
    }

    async getOwnedList(userId: string, listId: string): Promise<BoardList> {
        const list = await this.listRepository.findOne({ where: { id: listId } });
        if (!list) throw new NotFoundException('Lista no encontrada');
        await this.getOwned(userId, list.boardId);
        return list;
    }

    private async accessibleBoards(userId: string): Promise<Board[]> {
        const departmentId = await this.userDepartmentId(userId);
        const sharedCondition = departmentId
            ? 'share_access.user_id = :userId OR share_access.department_id = :departmentId'
            : 'share_access.user_id = :userId';
        return this.boardRepository
            .createQueryBuilder('board')
            .leftJoinAndSelect('board.lists', 'list')
            .leftJoinAndSelect('board.shares', 'share')
            .where('board.ownerUserId = :userId')
            .orWhere(`board.id IN (SELECT share_access.board_id FROM board_shares share_access WHERE ${sharedCondition})`)
            .setParameters({ userId, departmentId })
            .getMany();
    }

    private async userDepartmentId(userId: string): Promise<string | null> {
        const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['employee'] });
        if (user?.employee?.departmentId) return user.employee.departmentId;
        if (user?.employeeId) {
            const employee = await this.employeeRepository.findOne({ where: { id: user.employeeId } });
            return employee?.departmentId ?? null;
        }
        const employee = await this.employeeRepository.findOne({ where: { user: { id: userId } } });
        return employee?.departmentId ?? null;
    }

    // --- Creación inicial y migración de tareas antiguas ---

    /** Crea el tablero Recapmeeting si falta y ubica las tareas del usuario que aún no tienen tablero. */
    async ensureUserSetup(userId: string): Promise<Board> {
        const recapBoard = await this.ensureRecapBoard(userId);
        const orphans = await this.taskRepository.find({ where: { assigneeUserId: userId, boardId: IsNull() } });
        if (orphans.length === 0) return recapBoard;

        let manualBoard: Board | null = null;
        for (const task of orphans) {
            let boardId = recapBoard.id;
            if (task.source === TaskSource.MANUAL) {
                manualBoard ??= await this.boardRepository.findOne({
                    where: { ownerUserId: userId, type: BoardType.CUSTOM, name: LEGACY_MANUAL_BOARD_NAME },
                }) ?? await this.createBoard(userId, LEGACY_MANUAL_BOARD_NAME);
                boardId = manualBoard.id;
            }
            const lists = this.sortLists(await this.listRepository.find({ where: { boardId } }));
            const list = (task.status as string) === LEGACY_IN_PROGRESS
                ? lists.find((l) => !l.isDone && l.name === 'En progreso') ?? lists.find((l) => !l.isDone)!
                : lists.find((l) => l.isDone === (task.status === TaskStatus.DONE)) ?? lists[0];
            task.boardId = boardId;
            task.listId = list.id;
            task.status = list.isDone ? TaskStatus.DONE : TaskStatus.PENDING;
            task.position = await this.nextPosition(list.id);
            // Pasa a la lista de Google del tablero.
            task.googleTaskId = null;
            task.googleUpdatedAt = null;
            task.googleSyncPending = true;
            await this.taskRepository.save(task);
        }
        return recapBoard;
    }

    async ensureRecapBoard(userId: string): Promise<Board> {
        const existing = await this.boardRepository.findOne({ where: { ownerUserId: userId, type: BoardType.RECAPMEETING } });
        if (existing) return existing;
        const board = await this.boardRepository.save(this.boardRepository.create({
            ownerUserId: userId, name: RECAP_BOARD_NAME, type: BoardType.RECAPMEETING,
        }));
        await this.createDefaultLists(board.id);
        return board;
    }

    private createDefaultLists(boardId: string): Promise<BoardList[]> {
        return this.listRepository.save(DEFAULT_LISTS.map((l, position) =>
            this.listRepository.create({ boardId, name: l.name, isDone: l.isDone, position })));
    }

    sortLists(lists: BoardList[] = []): BoardList[] {
        return [...lists].sort((a, b) => a.position - b.position || a.createdAt.getTime() - b.createdAt.getTime());
    }

    private displayName(user: User): string {
        const employee = user.employee;
        const full = employee ? `${employee.firstName ?? ''} ${employee.lastName ?? ''}`.trim() : '';
        return full || user.email;
    }
}
