import { HttpException, ServiceUnavailableException } from '@nestjs/common';
import { MinutesService } from './minutes.service';

describe('MinutesService', () => {
    const fetchMock = jest.fn();
    const config = { get: jest.fn((key: string) => ({ RECAPMEETING_API_KEY: 'k'.repeat(32) } as Record<string, string>)[key]) };
    let service: MinutesService;

    const respond = (status: number, body: object) =>
        fetchMock.mockResolvedValueOnce({ ok: status < 400, status, json: async () => body });

    beforeEach(() => {
        jest.clearAllMocks();
        global.fetch = fetchMock as any;
        service = new MinutesService(config as any, { emit: jest.fn() } as any);
    });

    it('firma la petición con la API key y el correo del usuario', async () => {
        respond(200, { result: true, Response: [] });
        await service.clients('victor@strategee.us');

        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe('https://recapmeeting.com/apis/ms_clients');
        expect(init.headers['X-Api-Key']).toBe('k'.repeat(32));
        expect((init.body as URLSearchParams).get('user_email')).toBe('victor@strategee.us');
    });

    it('envía arreglos y compromisos con la notación de corchetes de PHP e ignora team_id', async () => {
        respond(200, { result: true, Response: { id: 10 } });
        await service.save('v@strategee.us', {
            team_id: 5,
            client_id: 3,
            funcionarios: [7, 8],
            externos: [],
            commitments: [{ user_id: 7, description: 'Enviar informe', delivery_date: '2026-12-01' }],
            state: 0,
        }, '42');

        const body: URLSearchParams = fetchMock.mock.calls[0][1].body;
        expect(fetchMock.mock.calls[0][0]).toContain('/ms_save_minute');
        expect(body.get('minute_id')).toBe('42');
        expect(body.get('team_id')).toBeNull();
        expect(body.getAll('funcionarios[0]')).toEqual(['7']);
        expect(body.get('funcionarios[1]')).toBe('8');
        expect(body.has('externos')).toBe(true); // lista vacía: el campo existe para vaciar los externos
        expect(body.get('commitments[0][user_id]')).toBe('7');
        expect(body.get('commitments[0][delivery_date]')).toBe('2026-12-01');
        expect(body.get('state')).toBe('0');
    });

    it('convierte ids y estados numéricos a texto', async () => {
        respond(200, { result: true, Response: [{ Contac: { id: 3406, state: 0, has_password: false } }] });
        const [minute] = await service.list('v@strategee.us');
        expect(minute.Contac).toEqual({ id: '3406', state: '0', has_password: false });
    });

    it('propaga el mensaje y el código de error de recapmeeting', async () => {
        respond(422, { result: false, message: 'La fecha inicio no puede ser mayor a la fecha actual.' });
        await expect(service.save('v@strategee.us', { state: 0 })).rejects.toMatchObject({
            status: 422,
            message: 'La fecha inicio no puede ser mayor a la fecha actual.',
        });
    });

    it('trata un 401 de recapmeeting como error de configuración (no cierra la sesión de la app)', async () => {
        respond(401, { result: false, message: 'No autorizado' });
        await expect(service.clients('v@strategee.us')).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    it('falla sin llamar a recapmeeting si no hay API key', async () => {
        const unconfigured = new MinutesService({ get: () => undefined } as any, { emit: jest.fn() } as any);
        await expect(unconfigured.clients('v@strategee.us')).rejects.toBeInstanceOf(ServiceUnavailableException);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('sube archivos como multipart con el tipo indicado', async () => {
        respond(200, { result: true, Response: { id: 5 } });
        await service.upload('v@strategee.us', '42', 'document', {
            buffer: Buffer.from('pdf'), mimetype: 'application/pdf', originalname: 'acta.pdf',
        } as Express.Multer.File);

        const form: FormData = fetchMock.mock.calls[0][1].body;
        expect(fetchMock.mock.calls[0][0]).toContain('/ms_upload_file');
        expect(form.get('type')).toBe('document');
        expect(form.get('minute_id')).toBe('42');
        expect((form.get('file') as File).name).toBe('acta.pdf');
    });

    it('responde 502 si recapmeeting no devuelve JSON', async () => {
        fetchMock.mockResolvedValueOnce({ ok: false, status: 500, json: async () => { throw new Error('html'); } });
        await expect(service.clients('v@strategee.us')).rejects.toMatchObject({ status: 502 });
        expect(HttpException).toBeDefined();
    });
});
