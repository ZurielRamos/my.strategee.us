import { Injectable, Logger } from '@nestjs/common';
import { GoogleWorkspaceService } from '../google-workspace.service';

const TASKS_API = 'https://tasks.googleapis.com/tasks/v1';
export const GOOGLE_TASKS_SCOPE = 'https://www.googleapis.com/auth/tasks';

export interface GoogleTask {
    id: string;
    title?: string;
    notes?: string;
    /** RFC 3339; Google solo guarda la fecha (la hora siempre es 00:00:00Z). */
    due?: string;
    status: 'needsAction' | 'completed';
    completed?: string;
    deleted?: boolean;
    hidden?: boolean;
    updated: string;
}

export interface GoogleTaskInput {
    title: string;
    notes?: string | null;
    /** YYYY-MM-DD */
    dueDate?: string | null;
    done: boolean;
}

/** Error de Google Tasks con el código HTTP, para distinguir 404 (tarea o lista borrada). */
export class GoogleTasksError extends Error {
    constructor(readonly status: number, message: string) {
        super(message);
    }
}

/** Cliente de Google Tasks (listas y tareas de un usuario). */
@Injectable()
export class GoogleTasksService {
    private readonly logger = new Logger(GoogleTasksService.name);

    constructor(private readonly googleWorkspaceService: GoogleWorkspaceService) { }

    /** Usuarios que concedieron el permiso de Google Tasks. */
    async connectedUserIds(): Promise<string[]> {
        const records = await this.googleWorkspaceService.findConnectedUsers(GOOGLE_TASKS_SCOPE);
        return records.map((r) => r.userId);
    }

    async isConnected(userId: string): Promise<boolean> {
        return (await this.connectedUserIds()).includes(userId);
    }

    /** true si la lista existe todavía en Google (el usuario pudo borrarla). */
    async listExists(userId: string, listId: string): Promise<boolean> {
        try {
            await this.request(userId, 'GET', `/users/@me/lists/${encodeURIComponent(listId)}`);
            return true;
        } catch (error) {
            if (error instanceof GoogleTasksError && error.status === 404) return false;
            throw error;
        }
    }

    async createList(userId: string, title: string): Promise<string> {
        const list = await this.request<{ id: string }>(userId, 'POST', '/users/@me/lists', { title: title.slice(0, 100) });
        return list.id;
    }

    async renameList(userId: string, listId: string, title: string): Promise<void> {
        await this.request(userId, 'PATCH', `/users/@me/lists/${encodeURIComponent(listId)}`, { title: title.slice(0, 100) });
    }

    async deleteList(userId: string, listId: string): Promise<void> {
        try {
            await this.request(userId, 'DELETE', `/users/@me/lists/${encodeURIComponent(listId)}`);
        } catch (error) {
            if (!(error instanceof GoogleTasksError && error.status === 404)) throw error;
        }
    }

    insert(userId: string, listId: string, input: GoogleTaskInput): Promise<GoogleTask> {
        return this.request<GoogleTask>(userId, 'POST', `/lists/${encodeURIComponent(listId)}/tasks`, this.toBody(input));
    }

    patch(userId: string, listId: string, taskId: string, input: GoogleTaskInput): Promise<GoogleTask> {
        return this.request<GoogleTask>(
            userId, 'PATCH', `/lists/${encodeURIComponent(listId)}/tasks/${encodeURIComponent(taskId)}`, this.toBody(input),
        );
    }

    async remove(userId: string, listId: string, taskId: string): Promise<void> {
        try {
            await this.request(userId, 'DELETE', `/lists/${encodeURIComponent(listId)}/tasks/${encodeURIComponent(taskId)}`);
        } catch (error) {
            if (!(error instanceof GoogleTasksError && error.status === 404)) {
                throw error;
            }
        }
    }

    /** Tareas de la lista modificadas desde updatedMin, incluidas completadas y borradas. */
    async listUpdated(userId: string, listId: string, updatedMin: string | null): Promise<GoogleTask[]> {
        const tasks: GoogleTask[] = [];
        let pageToken: string | undefined;
        do {
            const params = new URLSearchParams({
                maxResults: '100',
                showCompleted: 'true',
                showHidden: 'true',
                showDeleted: 'true',
            });
            if (updatedMin) params.set('updatedMin', updatedMin);
            if (pageToken) params.set('pageToken', pageToken);
            const page = await this.request<{ items?: GoogleTask[]; nextPageToken?: string }>(
                userId, 'GET', `/lists/${encodeURIComponent(listId)}/tasks?${params}`,
            );
            tasks.push(...(page.items ?? []));
            pageToken = page.nextPageToken;
        } while (pageToken);
        return tasks;
    }

    private toBody(input: GoogleTaskInput): Record<string, unknown> {
        return {
            title: input.title,
            notes: input.notes ?? '',
            due: input.dueDate ? `${input.dueDate}T00:00:00.000Z` : null,
            status: input.done ? 'completed' : 'needsAction',
            // Al reabrir hay que limpiar la fecha de completado.
            ...(input.done ? {} : { completed: null }),
        };
    }

    private async request<T = unknown>(userId: string, method: string, path: string, body?: unknown): Promise<T> {
        const accessToken = await this.googleWorkspaceService.getAccessToken(userId);
        const res = await fetch(`${TASKS_API}${path}`, {
            method,
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: body === undefined ? undefined : JSON.stringify(body),
            signal: AbortSignal.timeout(20_000),
        });
        if (res.status === 401) {
            this.googleWorkspaceService.forgetAccessToken(userId);
        }
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            this.logger.warn(`Google Tasks ${method} ${path} respondió ${res.status}: ${text.slice(0, 300)}`);
            throw new GoogleTasksError(res.status, `Google Tasks respondió ${res.status}`);
        }
        if (res.status === 204) {
            return undefined as T;
        }
        return (await res.json()) as T;
    }
}
