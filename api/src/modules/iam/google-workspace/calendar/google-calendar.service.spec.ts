import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { GoogleCalendarService } from './google-calendar.service';
import { GoogleWorkspaceService } from '../google-workspace.service';
import { CalendarEventLink } from './entities/calendar-event-link.entity';

describe('GoogleCalendarService', () => {
    let service: GoogleCalendarService;
    const workspace = {
        getStatus: jest.fn(),
        getConnectedEmail: jest.fn(),
        getAccessToken: jest.fn(),
        disconnect: jest.fn(),
    };
    const repo = {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn((v) => ({ ...v })),
        save: jest.fn(async (v) => v),
        delete: jest.fn(),
    };
    const fetchMock = jest.fn();

    beforeEach(async () => {
        jest.clearAllMocks();
        global.fetch = fetchMock as any;
        const moduleRef = await Test.createTestingModule({
            providers: [
                GoogleCalendarService,
                { provide: GoogleWorkspaceService, useValue: workspace },
                { provide: getRepositoryToken(CalendarEventLink), useValue: repo },
            ],
        }).compile();
        service = moduleRef.get(GoogleCalendarService);
    });

    describe('getStatus', () => {
        it('conectado con el correo de Google cuando tiene el permiso de Calendar', async () => {
            workspace.getStatus.mockResolvedValue({ eligible: true, missingScopes: [] });
            workspace.getConnectedEmail.mockResolvedValue('victor@strategee.us');
            await expect(service.getStatus('u1', 'victor@strategee.us'))
                .resolves.toEqual({ connected: true, email: 'victor@strategee.us' });
        });

        it('no conectado si falta el permiso de Calendar', async () => {
            workspace.getStatus.mockResolvedValue({
                eligible: true,
                missingScopes: ['https://www.googleapis.com/auth/calendar.events'],
            });
            await expect(service.getStatus('u1', 'victor@strategee.us')).resolves.toEqual({ connected: false });
        });
    });

    describe('getEvents', () => {
        it('lee el calendario principal y adapta los eventos al formato de la app', async () => {
            workspace.getAccessToken.mockResolvedValue('at');
            fetchMock.mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({
                    items: [
                        {
                            id: 'e1',
                            summary: 'Reunión',
                            status: 'confirmed',
                            htmlLink: 'https://calendar.google.com/e1',
                            start: { dateTime: '2026-11-25T10:00:00-05:00' },
                            end: { dateTime: '2026-11-25T11:00:00-05:00' },
                            organizer: { email: 'a@strategee.us', displayName: 'A' },
                            attendees: [
                                { email: 'b@strategee.us', responseStatus: 'accepted' },
                                { email: 'sala@resource.calendar.google.com', resource: true },
                            ],
                            conferenceData: { entryPoints: [{ entryPointType: 'video', uri: 'https://meet.google.com/x' }] },
                        },
                        { id: 'e2', summary: 'Feriado', status: 'confirmed', start: { date: '2026-11-26' }, end: { date: '2026-11-27' } },
                        { id: 'e3', status: 'cancelled', start: {}, end: {} },
                    ],
                }),
            });

            const events = await service.getEvents('u1', {
                timeMin: '2026-11-25T00:00:00Z',
                timeMax: '2026-11-26T00:00:00Z',
                maxResults: 50,
            });

            const [url, init] = fetchMock.mock.calls[0];
            expect(url).toContain('/calendars/primary/events?');
            expect(url).toContain('singleEvents=true');
            expect(url).toContain('maxResults=50');
            expect(init.headers.Authorization).toBe('Bearer at');
            expect(events).toHaveLength(2);
            expect(events[0]).toMatchObject({
                id: 'e1',
                title: 'Reunión',
                allDay: false,
                organizer: { email: 'a@strategee.us', name: 'A' },
                attendees: [{ email: 'b@strategee.us', name: null, responseStatus: 'accepted' }],
                conferenceLink: 'https://meet.google.com/x',
            });
            expect(events[1]).toMatchObject({ id: 'e2', allDay: true, start: '2026-11-26' });
        });

        it.each([
            ['sin autorización guardada', new NotFoundException()],
            ['autorización revocada', new UnauthorizedException()],
        ])('responde 409 (no 401) %s', async (_label, error) => {
            workspace.getAccessToken.mockRejectedValue(error);
            await expect(service.getEvents('u1', {})).rejects.toBeInstanceOf(ConflictException);
        });

        it('responde 409 si Google Calendar rechaza el token', async () => {
            workspace.getAccessToken.mockResolvedValue('at');
            fetchMock.mockResolvedValue({ ok: false, status: 403, text: async () => 'insufficient scopes' });
            await expect(service.getEvents('u1', {})).rejects.toBeInstanceOf(ConflictException);
        });
    });

    describe('event links', () => {
        it('reemplaza el acta si el evento ya estaba vinculado', async () => {
            repo.findOne.mockResolvedValue({ id: 'l1', userId: 'u1', googleEventId: 'e1', minuteId: 'm-old' });
            const link = await service.linkEventToMinute('u1', 'e1', 'm-new');
            expect(repo.create).not.toHaveBeenCalled();
            expect(link).toMatchObject({ id: 'l1', minuteId: 'm-new' });
        });

        it('solo desvincula eventos del propio usuario', async () => {
            repo.delete.mockResolvedValue({ affected: 0 });
            await expect(service.unlinkEvent('u1', 'e9')).rejects.toBeInstanceOf(NotFoundException);
            expect(repo.delete).toHaveBeenCalledWith({ userId: 'u1', googleEventId: 'e9' });
        });
    });
});
