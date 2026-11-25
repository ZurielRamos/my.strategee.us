import {
    BadGatewayException,
    ConflictException,
    Injectable,
    Logger,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoogleWorkspaceService } from '../google-workspace.service';
import { CalendarEventLink } from './entities/calendar-event-link.entity';
import { ListCalendarEventsDto } from './dto/calendar.dto';

const CALENDAR_EVENTS_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

/** Formato que espera la app (CalendarEvent en app/src/app/employee/calendar/models). */
export interface CalendarEventDto {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    start: string;
    end: string;
    allDay: boolean;
    status: string;
    htmlLink: string;
    organizer: { email: string; name: string | null } | null;
    attendees: { email: string; name: string | null; responseStatus: string }[] | null;
    conferenceLink: string | null;
}

export interface CalendarStatusDto {
    connected: boolean;
    email?: string;
}

/** Mensaje y código cuando falta o expiró la autorización de Google (no es 401 para no cerrar la sesión de la app). */
const NOT_CONNECTED_MESSAGE = 'Google Calendar no está conectado. Vuelve a conectarlo.';

@Injectable()
export class GoogleCalendarService {
    private readonly logger = new Logger(GoogleCalendarService.name);

    constructor(
        private readonly googleWorkspaceService: GoogleWorkspaceService,
        @InjectRepository(CalendarEventLink)
        private readonly linkRepository: Repository<CalendarEventLink>,
    ) { }

    async getStatus(userId: string, email: string): Promise<CalendarStatusDto> {
        const status = await this.googleWorkspaceService.getStatus(userId, email);
        const calendarGranted = status.eligible
            && !status.missingScopes.includes('https://www.googleapis.com/auth/calendar.events');
        if (!calendarGranted) {
            return { connected: false };
        }
        const googleEmail = await this.googleWorkspaceService.getConnectedEmail(userId);
        return googleEmail ? { connected: true, email: googleEmail } : { connected: false };
    }

    async getEvents(userId: string, query: ListCalendarEventsDto): Promise<CalendarEventDto[]> {
        const accessToken = await this.getAccessToken(userId);

        const now = new Date();
        const params = new URLSearchParams({
            singleEvents: 'true',
            orderBy: 'startTime',
            maxResults: String(query.maxResults ?? 100),
            timeMin: query.timeMin ?? now.toISOString(),
            timeMax: query.timeMax ?? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });

        let response: Response;
        try {
            response = await fetch(`${CALENDAR_EVENTS_URL}?${params}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
        } catch (error) {
            this.logger.error(`Error de red al contactar Google Calendar: ${error}`);
            throw new BadGatewayException('No se pudo contactar a Google Calendar');
        }

        if (response.status === 401 || response.status === 403) {
            const body = await response.text().catch(() => '');
            this.logger.warn(`Google Calendar rechazó la solicitud (${response.status}): ${body}`);
            throw new ConflictException(NOT_CONNECTED_MESSAGE);
        }
        if (!response.ok) {
            this.logger.warn(`Google Calendar respondió ${response.status}`);
            throw new BadGatewayException('Google Calendar no respondió correctamente');
        }

        const body = (await response.json()) as { items?: any[] };
        return (body.items ?? [])
            .filter((item) => item.status !== 'cancelled')
            .map((item) => this.mapEvent(item));
    }

    async disconnect(userId: string): Promise<{ success: boolean; message: string }> {
        await this.googleWorkspaceService.disconnect(userId);
        return { success: true, message: 'Google Calendar desconectado' };
    }

    // --- Vínculos evento-acta ---

    getEventLinks(userId: string): Promise<CalendarEventLink[]> {
        return this.linkRepository.find({ where: { userId }, order: { createdAt: 'DESC' } });
    }

    async getEventLink(userId: string, googleEventId: string): Promise<CalendarEventLink | null> {
        return this.linkRepository.findOne({ where: { userId, googleEventId } });
    }

    /** Crea o reemplaza el acta vinculada a un evento. */
    async linkEventToMinute(userId: string, googleEventId: string, minuteId: string): Promise<CalendarEventLink> {
        const existing = await this.getEventLink(userId, googleEventId);
        const link = existing ?? this.linkRepository.create({ userId, googleEventId });
        link.minuteId = minuteId;
        return this.linkRepository.save(link);
    }

    async unlinkEvent(userId: string, googleEventId: string): Promise<{ success: boolean }> {
        const result = await this.linkRepository.delete({ userId, googleEventId });
        if (!result.affected) {
            throw new NotFoundException('El evento no tiene un acta vinculada');
        }
        return { success: true };
    }

    private async getAccessToken(userId: string): Promise<string> {
        try {
            return await this.googleWorkspaceService.getAccessToken(userId);
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
                throw new ConflictException(NOT_CONNECTED_MESSAGE);
            }
            throw error;
        }
    }

    private mapEvent(item: any): CalendarEventDto {
        const allDay = !!item.start?.date && !item.start?.dateTime;
        const conference = item.conferenceData?.entryPoints?.find((e: any) => e.entryPointType === 'video');
        return {
            id: item.id,
            title: item.summary || '(Sin título)',
            description: item.description ?? null,
            location: item.location ?? null,
            start: item.start?.dateTime ?? item.start?.date,
            end: item.end?.dateTime ?? item.end?.date,
            allDay,
            status: item.status,
            htmlLink: item.htmlLink,
            organizer: item.organizer
                ? { email: item.organizer.email, name: item.organizer.displayName ?? null }
                : null,
            attendees: item.attendees
                ? item.attendees
                    .filter((a: any) => !a.resource)
                    .map((a: any) => ({
                        email: a.email,
                        name: a.displayName ?? null,
                        responseStatus: a.responseStatus,
                    }))
                : null,
            conferenceLink: conference?.uri ?? item.hangoutLink ?? null,
        };
    }
}
