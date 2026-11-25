/** Una tarea cambió y hay que enviarla a Google Tasks. */
export const TASK_CHANGED_EVENT = 'tasks.changed';
/** Una tarea se borró o cambió de responsable: hay que quitarla de la lista de Google de ese usuario. */
export const TASK_REMOVED_EVENT = 'tasks.removed';
/** Se renombró un tablero: se renombran sus listas en Google Tasks. */
export const BOARD_RENAMED_EVENT = 'boards.renamed';
/** Se borró un tablero: se borran sus listas en Google Tasks. */
export const BOARD_DELETED_EVENT = 'boards.deleted';

export interface TaskChangedPayload {
    taskId: string;
}

export interface TaskRemovedPayload {
    userId: string;
    boardId: string;
    googleTaskId: string;
}

export interface BoardRenamedPayload {
    boardId: string;
    name: string;
}

export interface BoardDeletedPayload {
    lists: { userId: string; googleListId: string }[];
}
