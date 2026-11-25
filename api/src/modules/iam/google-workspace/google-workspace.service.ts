import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
    ServiceUnavailableException,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EncryptionService } from '@modules/security/password-vault/services/encryption.service';
import { UsersService } from '../users/users.service';
import { GoogleWorkspaceToken } from './entities/google-workspace-token.entity';
import { GOOGLE_WORKSPACE_SCOPES, normalizeScopes } from './google-workspace.scopes';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_REVOKE_URL = 'https://oauth2.googleapis.com/revoke';

interface GoogleTokenResponse {
    access_token?: string;
    expires_in?: number;
    refresh_token?: string;
    scope?: string;
    id_token?: string;
    error?: string;
    error_description?: string;
}

export interface GoogleWorkspaceStatus {
    /** El usuario pertenece al dominio de Workspace. */
    eligible: boolean;
    /** Tiene un refresh token guardado con todos los permisos requeridos. */
    connected: boolean;
    /** Permisos que la app debe pedir. */
    scopes: string[];
    /** Permisos requeridos que aún no ha concedido. */
    missingScopes: string[];
    domain: string;
}

@Injectable()
export class GoogleWorkspaceService {
    private readonly logger = new Logger(GoogleWorkspaceService.name);

    constructor(
        @InjectRepository(GoogleWorkspaceToken)
        private readonly tokenRepository: Repository<GoogleWorkspaceToken>,
        private readonly usersService: UsersService,
        private readonly encryptionService: EncryptionService,
        private readonly configService: ConfigService,
    ) { }

    private get domain(): string {
        return (this.configService.get<string>('GOOGLE_WORKSPACE_DOMAIN') || 'strategee.us').toLowerCase();
    }

    isEligibleEmail(email: string | null | undefined): boolean {
        return !!email && email.toLowerCase().endsWith(`@${this.domain}`);
    }

    async getStatus(userId: string, email: string): Promise<GoogleWorkspaceStatus> {
        const scopes = [...GOOGLE_WORKSPACE_SCOPES];
        const eligible = this.isEligibleEmail(email);
        const token = eligible ? await this.tokenRepository.findOne({ where: { userId } }) : null;
        const granted = new Set(normalizeScopes(token?.scopes));
        const missingScopes = scopes.filter((s) => !granted.has(s));
        return {
            eligible,
            connected: !!token && missingScopes.length === 0,
            scopes,
            missingScopes: eligible ? missingScopes : [],
            domain: this.domain,
        };
    }

    /**
     * Cambia el código de autorización por tokens y guarda el refresh token cifrado.
     * Verifica que la cuenta de Google sea la misma del usuario y pertenezca al dominio.
     */
    async connect(userId: string, code: string, redirectUri: '' | 'postmessage' = ''): Promise<GoogleWorkspaceStatus> {
        const user = await this.usersService.findOne(userId);
        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }
        if (!this.isEligibleEmail(user.email)) {
            throw new ForbiddenException(`Solo las cuentas de ${this.domain} pueden conectar Google Workspace`);
        }

        const tokens = await this.requestToken({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
        });

        // El id_token viene directo del endpoint de tokens de Google por TLS,
        // así que se puede leer sin verificar la firma (OpenID Connect Core 3.1.3.7).
        const claims = this.decodeIdToken(tokens.id_token);
        const googleEmail = claims?.email?.toLowerCase();
        if (!googleEmail || googleEmail !== user.email.toLowerCase()) {
            throw new ForbiddenException('La cuenta de Google autorizada no coincide con tu usuario');
        }
        if (claims?.hd?.toLowerCase() !== this.domain) {
            throw new ForbiddenException(`La cuenta de Google debe pertenecer a ${this.domain}`);
        }

        const existing = await this.tokenRepository.findOne({ where: { userId } });
        const refreshToken = tokens.refresh_token
            ?? (existing ? this.encryptionService.decrypt(existing.encryptedRefreshToken) : null);
        if (!refreshToken) {
            throw new BadRequestException(
                'Google no devolvió un refresh token. Quita el acceso de la app en tu cuenta de Google e inténtalo de nuevo.',
            );
        }

        const record = existing ?? this.tokenRepository.create({ userId });
        record.googleEmail = googleEmail;
        record.encryptedRefreshToken = this.encryptionService.encrypt(refreshToken);
        record.scopes = normalizeScopes(tokens.scope).join(' ');
        await this.tokenRepository.save(record);

        return this.getStatus(userId, user.email);
    }

    /**
     * Devuelve un access token vigente para llamar a las APIs de Google en nombre del usuario.
     * Si Google revocó el acceso, borra la autorización guardada.
     */
    async getAccessToken(userId: string): Promise<string> {
        const record = await this.tokenRepository.findOne({ where: { userId } });
        if (!record) {
            throw new NotFoundException('El usuario no ha conectado Google Workspace');
        }
        try {
            const tokens = await this.requestToken({
                grant_type: 'refresh_token',
                refresh_token: this.encryptionService.decrypt(record.encryptedRefreshToken),
            });
            if (!tokens.access_token) {
                throw new UnauthorizedException('Google no devolvió un access token');
            }
            return tokens.access_token;
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                await this.tokenRepository.delete({ userId });
            }
            throw error;
        }
    }

    async disconnect(userId: string): Promise<void> {
        const record = await this.tokenRepository.findOne({ where: { userId } });
        if (!record) {
            return;
        }
        try {
            const refreshToken = this.encryptionService.decrypt(record.encryptedRefreshToken);
            await fetch(GOOGLE_REVOKE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ token: refreshToken }),
            });
        } catch (error) {
            this.logger.warn(`No se pudo revocar el token de Google del usuario ${userId}: ${error}`);
        }
        await this.tokenRepository.delete({ userId });
    }

    private async requestToken(params: Record<string, string>): Promise<GoogleTokenResponse> {
        const clientId = this.configService.get<string>('GOOGLE_OAUTH_CLIENT_ID');
        const clientSecret = this.configService.get<string>('GOOGLE_OAUTH_CLIENT_SECRET');
        if (!clientId || !clientSecret) {
            throw new ServiceUnavailableException('Google Workspace no está configurado en el servidor');
        }

        let response: Response;
        try {
            response = await fetch(GOOGLE_TOKEN_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ ...params, client_id: clientId, client_secret: clientSecret }),
            });
        } catch (error) {
            this.logger.error(`Error de red al contactar Google: ${error}`);
            throw new ServiceUnavailableException('No se pudo contactar a Google');
        }

        const body = (await response.json().catch(() => ({}))) as GoogleTokenResponse;
        if (!response.ok) {
            this.logger.warn(`Google rechazó la solicitud de token: ${body.error} ${body.error_description ?? ''}`);
            if (body.error === 'invalid_grant') {
                throw new UnauthorizedException('La autorización de Google expiró o fue revocada');
            }
            throw new BadRequestException('Google rechazó la autorización');
        }
        return body;
    }

    private decodeIdToken(idToken: string | undefined): { email?: string; hd?: string } | null {
        if (!idToken) {
            return null;
        }
        try {
            const payload = idToken.split('.')[1];
            return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        } catch {
            return null;
        }
    }
}
