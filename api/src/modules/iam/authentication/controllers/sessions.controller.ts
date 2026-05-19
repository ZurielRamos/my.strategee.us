import {
    Controller,
    Get,
    Delete,
    Param,
    UseGuards,
    HttpCode,
    HttpStatus,
    Req,
} from '@nestjs/common';
import {
    ApiTags,
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { SessionsService } from '../services/sessions.service';
import { AccessTokenGuard } from '../guards/access-token.guard';
import { ActiveUser } from '../../authorization/decorators/active-user.decorator';
import { SessionResponseDto } from '../dto/session-response.dto';
import { Request } from 'express';

@ApiTags('Sessions')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
@Controller('sessions')
export class SessionsController {
    constructor(private readonly sessionsService: SessionsService) { }

    @Get()
    @ApiOperation({ summary: 'Listar todas las sesiones activas del usuario actual' })
    @ApiResponse({
        status: 200, type: [SessionResponseDto],
        example: [
            {
                "id": "cd18e386-cf3e-4dc2-b83d-43ca7e20d222",
                "deviceName": "Chrome on macOS",
                "deviceType": "desktop",
                "ipAddress": "::1",
                "lastUsedAt": "2026-02-11T00:08:50.000Z",
                "createdAt": "2026-02-11T05:08:47.195Z",
                "isCurrent": false,
                "updatedAt": "2026-02-11T05:08:48.000Z"
            },
            {
                "id": "48eaba55-c3c3-4edc-a071-1363a3476965",
                "deviceName": "Chrome on macOS",
                "deviceType": "desktop",
                "ipAddress": "::1",
                "lastUsedAt": "2026-02-10T23:52:54.000Z",
                "createdAt": "2026-02-11T04:52:51.344Z",
                "isCurrent": false,
                "updatedAt": "2026-02-11T04:52:52.000Z"
            }
        ]
    })
    async listSessions(
        @ActiveUser('sub') userId: string,
        @ActiveUser('sessionId') currentSessionId: string,
    ): Promise<SessionResponseDto[]> {
        // Pass the current sessionId to mark it as current
        return this.sessionsService.getUserSessions(userId, currentSessionId);
    }

    @Delete('others')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Revocar todas las demás sesiones excepto la actual' })
    @ApiResponse({
        status: 200,
        description: 'Sesiones revocadas',
        example: {
            revoked: 8
        }
    })
    async revokeOtherSessions(
        @ActiveUser('sub') userId: string,
        @ActiveUser('sessionId') sessionId: string,
    ): Promise<{ revoked: number }> {
        // If no sessionId in token, revoke all sessions (for old tokens without sessionId)
        if (!sessionId) {
            const revoked = await this.sessionsService.revokeAllUserSessions(userId);
            return { revoked };
        }

        // Revoke all sessions except the current one
        const revoked = await this.sessionsService.revokeAllExcept(
            userId,
            sessionId,
        );
        return { revoked };
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Revocar una sesión específica (no puede ser la actual)' })
    @ApiResponse({ status: 204, description: 'Sesión revocada exitosamente' })
    @ApiResponse({ status: 404, description: 'Sesión no encontrada' })
    async revokeSession(
        @Param('id') sessionId: string,
        @ActiveUser('sub') userId: string,
    ): Promise<void> {
        await this.sessionsService.revokeSession(sessionId, userId);
    }
}
