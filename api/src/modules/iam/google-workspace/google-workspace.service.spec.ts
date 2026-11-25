import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { GoogleWorkspaceService } from './google-workspace.service';
import { GoogleWorkspaceToken } from './entities/google-workspace-token.entity';
import { UsersService } from '../users/users.service';
import { EncryptionService } from '@modules/security/password-vault/services/encryption.service';
import { GOOGLE_WORKSPACE_SCOPES } from './google-workspace.scopes';

const idToken = (claims: object) =>
    `x.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.y`;

const ALL_SCOPES_FROM_GOOGLE = GOOGLE_WORKSPACE_SCOPES
    .map((s) => (s === 'email' ? 'https://www.googleapis.com/auth/userinfo.email' : s))
    .join(' ');

describe('GoogleWorkspaceService', () => {
    let service: GoogleWorkspaceService;
    const repo = {
        findOne: jest.fn(),
        create: jest.fn((v) => ({ ...v })),
        save: jest.fn(async (v) => v),
        delete: jest.fn(),
    };
    const users = { findOne: jest.fn() };
    const encryption = {
        encrypt: jest.fn((t: string) => `enc(${t})`),
        decrypt: jest.fn((t: string) => t.replace(/^enc\((.*)\)$/, '$1')),
    };
    const config = {
        get: jest.fn((key: string) => ({
            GOOGLE_OAUTH_CLIENT_ID: 'client-id',
            GOOGLE_OAUTH_CLIENT_SECRET: 'client-secret',
            GOOGLE_WORKSPACE_DOMAIN: 'strategee.us',
        } as Record<string, string>)[key]),
    };
    const fetchMock = jest.fn();

    const googleResponds = (body: object, ok = true) =>
        fetchMock.mockResolvedValueOnce({ ok, json: async () => body });

    beforeEach(async () => {
        jest.clearAllMocks();
        global.fetch = fetchMock as any;
        const moduleRef = await Test.createTestingModule({
            providers: [
                GoogleWorkspaceService,
                { provide: getRepositoryToken(GoogleWorkspaceToken), useValue: repo },
                { provide: UsersService, useValue: users },
                { provide: EncryptionService, useValue: encryption },
                { provide: ConfigService, useValue: config },
            ],
        }).compile();
        service = moduleRef.get(GoogleWorkspaceService);
        users.findOne.mockResolvedValue({ id: 'u1', email: 'Victor@strategee.us' });
        repo.findOne.mockResolvedValue(null);
    });

    describe('getStatus', () => {
        it('marca como no elegibles a los usuarios de otros dominios', async () => {
            const status = await service.getStatus('u1', 'someone@gmail.com');
            expect(status).toMatchObject({ eligible: false, connected: false, missingScopes: [] });
            expect(repo.findOne).not.toHaveBeenCalled();
        });

        it('pide todos los permisos si el usuario del dominio no está conectado', async () => {
            const status = await service.getStatus('u1', 'victor@strategee.us');
            expect(status.eligible).toBe(true);
            expect(status.connected).toBe(false);
            expect(status.missingScopes).toEqual([...GOOGLE_WORKSPACE_SCOPES]);
        });

        it('queda conectado cuando tiene todos los permisos (con email expandido por Google)', async () => {
            repo.findOne.mockResolvedValue({ scopes: ALL_SCOPES_FROM_GOOGLE });
            const status = await service.getStatus('u1', 'victor@strategee.us');
            expect(status.connected).toBe(true);
            expect(status.missingScopes).toEqual([]);
        });
    });

    describe('connect', () => {
        it('guarda el refresh token cifrado y los permisos concedidos', async () => {
            googleResponds({
                refresh_token: 'rt-1',
                access_token: 'at',
                scope: ALL_SCOPES_FROM_GOOGLE,
                id_token: idToken({ email: 'victor@strategee.us', hd: 'strategee.us' }),
            });
            repo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ scopes: ALL_SCOPES_FROM_GOOGLE });

            const status = await service.connect('u1', 'code-1', '');

            const body: URLSearchParams = fetchMock.mock.calls[0][1].body;
            expect(body.get('grant_type')).toBe('authorization_code');
            expect(body.get('code')).toBe('code-1');
            expect(body.get('redirect_uri')).toBe('');
            expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({
                userId: 'u1',
                googleEmail: 'victor@strategee.us',
                encryptedRefreshToken: 'enc(rt-1)',
            }));
            expect(status.connected).toBe(true);
        });

        it('rechaza si la cuenta de Google no es la del usuario', async () => {
            googleResponds({
                refresh_token: 'rt',
                scope: ALL_SCOPES_FROM_GOOGLE,
                id_token: idToken({ email: 'otro@strategee.us', hd: 'strategee.us' }),
            });
            await expect(service.connect('u1', 'c')).rejects.toBeInstanceOf(ForbiddenException);
            expect(repo.save).not.toHaveBeenCalled();
        });

        it('rechaza si la cuenta de Google no pertenece al Workspace (sin hd)', async () => {
            googleResponds({
                refresh_token: 'rt',
                scope: ALL_SCOPES_FROM_GOOGLE,
                id_token: idToken({ email: 'victor@strategee.us' }),
            });
            await expect(service.connect('u1', 'c')).rejects.toBeInstanceOf(ForbiddenException);
            expect(repo.save).not.toHaveBeenCalled();
        });

        it('no llama a Google para usuarios de otros dominios', async () => {
            users.findOne.mockResolvedValue({ id: 'u1', email: 'someone@gmail.com' });
            await expect(service.connect('u1', 'c')).rejects.toBeInstanceOf(ForbiddenException);
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('conserva el refresh token anterior si Google no envía uno nuevo', async () => {
            googleResponds({
                scope: ALL_SCOPES_FROM_GOOGLE,
                id_token: idToken({ email: 'victor@strategee.us', hd: 'strategee.us' }),
            });
            repo.findOne.mockResolvedValue({ userId: 'u1', encryptedRefreshToken: 'enc(rt-old)', scopes: '' });
            await service.connect('u1', 'c');
            expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ encryptedRefreshToken: 'enc(rt-old)' }));
        });

        it('falla si no hay refresh token nuevo ni guardado', async () => {
            googleResponds({
                scope: ALL_SCOPES_FROM_GOOGLE,
                id_token: idToken({ email: 'victor@strategee.us', hd: 'strategee.us' }),
            });
            await expect(service.connect('u1', 'c')).rejects.toBeInstanceOf(BadRequestException);
        });
    });

    describe('getAccessToken', () => {
        it('borra la autorización si Google la revocó (invalid_grant)', async () => {
            repo.findOne.mockResolvedValue({ userId: 'u1', encryptedRefreshToken: 'enc(rt)' });
            googleResponds({ error: 'invalid_grant' }, false);
            await expect(service.getAccessToken('u1')).rejects.toThrow();
            expect(repo.delete).toHaveBeenCalledWith({ userId: 'u1' });
        });
    });
});
