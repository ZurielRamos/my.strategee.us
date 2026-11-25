export type TaskStatus = 'pending' | 'done';
export type TaskSource = 'manual' | 'recapmeeting';
export type BoardType = 'recapmeeting' | 'custom';

export interface Task {
    id: string;
    boardId: string;
    listId: string;
    position: number;
    assigneeUserId: string;
    title: string;
    description: string | null;
    /** YYYY-MM-DD */
    dueDate: string | null;
    status: TaskStatus;
    completedAt: string | null;
    source: TaskSource;
    recapCommitmentId: number | null;
    recapMinuteId: number | null;
    recapMinuteNumber: string | null;
    recapClientName: string | null;
    recapProjectName: string | null;
    googleTaskId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface BoardList {
    id: string;
    boardId: string;
    name: string;
    position: number;
    /** Las tareas en esta lista cuentan como hechas. */
    isDone: boolean;
}

export interface BoardShare {
    id: string;
    userId: string | null;
    departmentId: string | null;
}

export interface Board {
    id: string;
    name: string;
    type: BoardType;
    isOwner: boolean;
    ownerName: string;
    isShared: boolean;
    lists: BoardList[];
    /** Solo viene para el dueño. */
    shares: BoardShare[];
}

export interface BoardMember {
    id: string;
    name: string;
    email: string;
}

export interface ShareOptions {
    users: BoardMember[];
    departments: { id: string; name: string }[];
}

export interface CreateTaskPayload {
    boardId: string;
    listId?: string;
    assigneeUserId?: string;
    title: string;
    description?: string | null;
    dueDate?: string | null;
}

export interface UpdateTaskPayload {
    title?: string;
    description?: string | null;
    dueDate?: string | null;
    assigneeUserId?: string;
    listId?: string;
    position?: number;
}
