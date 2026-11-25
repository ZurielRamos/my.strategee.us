import {
    BadGatewayException,
    HttpException,
    Injectable,
    Logger,
    ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SaveMinuteDto } from './dto/save-minute.dto';

/** Publicar envía los correos del acta desde recapmeeting y puede tardar varios minutos. */
const DEFAULT_TIMEOUT_MS = 30_000;
const SAVE_TIMEOUT_MS = 300_000;

type RecapRecord = Record<string, any>;

/** Evento emitido al publicar un acta desde My Strategee (sus compromisos pasan a ser tareas). */
export const MINUTE_PUBLISHED_EVENT = 'minutes.published';

/** Compromiso tal como lo devuelve ms_list_commitments. */
export interface RecapCommitment {
    Commitment: {
        id: string;
        description: string;
        delivery_date: string | null;
        finished_date: string | null;
        /** 1 = pendiente, 2 = terminado */
        state: string;
        priority: string | null;
        user_id: string;
        contac_id: string;
        created: string;
        modified: string;
    };
    User: { id?: string; email?: string; firstname?: string; lastname?: string };
    Contac: { id?: string; number?: string };
    Client: { id?: string; name?: string };
    Project: { id?: string; name?: string };
}

interface RecapResponse<T> {
    result: boolean;
    Response?: T;
    message?: string;
}

/**
 * Proxy hacia la API de actas de recapmeeting (endpoints ms_* de ApisController).
 * Cada llamada va firmada con la API key compartida y el correo del usuario de My Strategee;
 * recapmeeting usa ese usuario como autor, igual que en su web.
 */
@Injectable()
export class MinutesService {
    private readonly logger = new Logger(MinutesService.name);

    constructor(
        private readonly configService: ConfigService,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    private get baseUrl(): string {
        return (this.configService.get<string>('RECAPMEETING_API_URL') || 'https://recapmeeting.com/apis').replace(/\/+$/, '');
    }

    // --- Catálogos ---

    clients(email: string) {
        return this.call<RecapRecord[]>('ms_clients', email);
    }

    projects(email: string, clientId?: string) {
        return this.call<RecapRecord[]>('ms_projects', email, { client_id: clientId });
    }

    teamUsers(email: string, clientId?: string) {
        return this.call<{ colaboradores: RecapRecord[]; externos: RecapRecord[] }>('ms_team_users', email, { client_id: clientId });
    }

    // --- Actas ---

    list(email: string, page = 1, clientId?: string, projectId?: string) {
        return this.call<RecapRecord[]>('ms_list_minutes', email, { page, client_id: clientId, project_id: projectId });
    }

    detail(email: string, minuteId: string) {
        return this.call<RecapRecord>('ms_view_minute', email, { minute_id: minuteId });
    }

    /** Crea (sin minuteId) o actualiza un borrador. state 0 publica el acta. */
    async save(email: string, dto: SaveMinuteDto, minuteId?: string) {
        const { team_id: _ignored, ...fields } = dto;
        const result = await this.call<RecapRecord>('ms_save_minute', email, { ...fields, minute_id: minuteId }, SAVE_TIMEOUT_MS);
        if (dto.state === 0) {
            this.eventEmitter.emit(MINUTE_PUBLISHED_EVENT, { minuteId: result?.id });
        }
        return result;
    }

    discard(email: string, minuteId: string) {
        return this.call<RecapRecord>('ms_discard_minute', email, { minute_id: minuteId });
    }

    upload(email: string, minuteId: string, type: 'image' | 'document', file: Express.Multer.File) {
        const form = new FormData();
        form.set('user_email', email);
        form.set('minute_id', minuteId);
        form.set('type', type);
        form.set('file', new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }), file.originalname);
        return this.request<RecapRecord>('ms_upload_file', form, SAVE_TIMEOUT_MS);
    }

    // --- Compromisos (tareas) ---

    /** Proceso del sistema: compromisos de actas finalizadas, 100 por página, por fecha de modificación. */
    listCommitments(modifiedSince: string | null, page: number) {
        return this.call<RecapCommitment[]>('ms_list_commitments', null, { modified_since: modifiedSince ?? undefined, page });
    }

    /** Marca un compromiso como terminado o pendiente, en nombre de su responsable. */
    setCommitmentState(email: string, commitmentId: string, done: boolean) {
        return this.call<{ id: string; state: string; finished_date: string | null; modified: string }>(
            'ms_set_commitment_state', email, { commitment_id: commitmentId, done: done ? 1 : 0 },
        );
    }

    private call<T>(endpoint: string, email: string | null, params: Record<string, unknown> = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
        const body = new URLSearchParams();
        if (email) {
            body.set('user_email', email);
        }
        this.appendForm(body, params);
        return this.request<T>(endpoint, body, timeoutMs);
    }

    private async request<T>(endpoint: string, body: URLSearchParams | FormData, timeoutMs: number): Promise<T> {
        const apiKey = this.configService.get<string>('RECAPMEETING_API_KEY');
        if (!apiKey) {
            throw new ServiceUnavailableException('La integración con recapmeeting no está configurada');
        }

        let res: Response;
        try {
            res = await fetch(`${this.baseUrl}/${endpoint}`, {
                method: 'POST',
                headers: { 'X-Api-Key': apiKey, Accept: 'application/json' },
                body,
                signal: AbortSignal.timeout(timeoutMs),
            });
        } catch (error) {
            this.logger.error(`Error al contactar recapmeeting (${endpoint}): ${error}`);
            throw new BadGatewayException('No se pudo contactar a recapmeeting');
        }

        let json: RecapResponse<T>;
        try {
            json = (await res.json()) as RecapResponse<T>;
        } catch {
            this.logger.warn(`recapmeeting respondió ${res.status} sin JSON en ${endpoint}`);
            throw new BadGatewayException('recapmeeting devolvió una respuesta inválida');
        }

        if (!res.ok || !json.result) {
            const status = res.ok ? 400 : res.status;
            if (status === 401) {
                // Clave mal configurada en uno de los dos servidores: no es un 401 del usuario de la app.
                this.logger.error('recapmeeting rechazó la API key (RECAPMEETING_API_KEY / ApisController::MS_API_KEY)');
                throw new ServiceUnavailableException('La integración con recapmeeting no está autorizada');
            }
            throw new HttpException(json.message || 'recapmeeting rechazó la solicitud', status >= 400 && status < 600 ? status : 502);
        }
        return this.stringifyIds(json.Response) as T;
    }

    /** Serializa objetos y arreglos con la notación de corchetes que entiende PHP: a[0][b]=1 */
    private appendForm(body: URLSearchParams, value: unknown, prefix = ''): void {
        if (value === undefined || value === null) {
            return;
        }
        if (Array.isArray(value)) {
            if (value.length === 0 && prefix) {
                body.append(prefix, ''); // Lista vacía: el campo existe pero sin elementos.
            }
            value.forEach((item, index) => this.appendForm(body, item, `${prefix}[${index}]`));
            return;
        }
        if (typeof value === 'object') {
            for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
                this.appendForm(body, item, prefix ? `${prefix}[${key}]` : key);
            }
            return;
        }
        body.append(prefix, String(value));
    }

    /** La app compara ids y estados como texto ('0' publicada, '1' borrador); recapmeeting envía números. */
    private stringifyIds(value: any): any {
        if (typeof value === 'number') {
            return String(value);
        }
        if (Array.isArray(value)) {
            return value.map((item) => this.stringifyIds(item));
        }
        if (value && typeof value === 'object') {
            return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, this.stringifyIds(item)]));
        }
        return value;
    }
}
