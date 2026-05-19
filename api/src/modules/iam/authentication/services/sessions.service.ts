import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Session } from '../entities/session.entity';
import { DeviceInfo } from '../interfaces/device-info.interface';
import { HashingService } from '../../hashing/hashing.service';
import { SessionResponseDto } from '../dto/session-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class SessionsService {
    constructor(
        @InjectRepository(Session)
        private readonly sessionRepository: Repository<Session>,
        private readonly hashingService: HashingService,
    ) { }

    /**
     * Crea una nueva sesión para el usuario
     */
    async createSession(
        userId: string,
        refreshToken: string,
        deviceInfo: DeviceInfo,
        expiresAt: Date,
    ): Promise<Session> {
        // Hash del refresh token antes de guardarlo
        const hashedRefreshToken = await this.hashingService.hash(refreshToken);

        const session = this.sessionRepository.create({
            userId,
            refreshToken: hashedRefreshToken,
            deviceName: deviceInfo.deviceName,
            deviceType: deviceInfo.deviceType,
            userAgent: deviceInfo.userAgent,
            ipAddress: deviceInfo.ipAddress,
            lastUsedAt: new Date(),
            expiresAt,
        });

        return this.sessionRepository.save(session);
    }

    /**
     * Encuentra una sesión por el refresh token sin hashear
     */
    async findByRefreshToken(refreshToken: string): Promise<Session | null> {
        // Obtener todas las sesiones activas (no expiradas)
        const sessions = await this.sessionRepository.find({
            where: {
                expiresAt: MoreThan(new Date()),
            },
        });

        // Comparar el refresh token con cada sesión
        for (const session of sessions) {
            const isMatch = await this.hashingService.compare(
                refreshToken,
                session.refreshToken,
            );
            if (isMatch) {
                return session;
            }
        }

        return null;
    }

    /**
     * Actualiza el timestamp de último uso de una sesión
     */
    async updateLastUsed(sessionId: string): Promise<void> {
        await this.sessionRepository.update(sessionId, {
            lastUsedAt: new Date(),
        });
    }

    /**
     * Actualiza el refresh token de una sesión (rotación de tokens)
     */
    async updateRefreshToken(
        sessionId: string,
        newRefreshToken: string,
        newExpiresAt: Date,
    ): Promise<void> {
        const hashedToken = await this.hashingService.hash(newRefreshToken);
        await this.sessionRepository.update(sessionId, {
            refreshToken: hashedToken,
            expiresAt: newExpiresAt,
            lastUsedAt: new Date(),
        });
    }

    /**
     * Revoca una sesión específica
     */
    async revokeSession(sessionId: string, userId: string): Promise<void> {
        const session = await this.sessionRepository.findOne({
            where: { id: sessionId, userId },
        });

        if (!session) {
            throw new NotFoundException('Sesión no encontrada');
        }

        await this.sessionRepository.delete(sessionId);
    }

    /**
     * Revoca todas las sesiones excepto la actual
     */
    async revokeAllExcept(userId: string, currentSessionId: string): Promise<number> {
        const result = await this.sessionRepository
            .createQueryBuilder()
            .delete()
            .where('userId = :userId', { userId })
            .andWhere('id != :currentSessionId', { currentSessionId })
            .execute();

        return result.affected || 0;
    }

    /**
     * Obtiene todas las sesiones activas de un usuario
     */
    async getUserSessions(
        userId: string,
        currentSessionId?: string,
    ): Promise<SessionResponseDto[]> {
        const sessions = await this.sessionRepository.find({
            where: { userId },
            order: { lastUsedAt: 'DESC' },
        });

        return sessions.map((session) =>
            plainToInstance(SessionResponseDto, {
                ...session,
                isCurrent: session.id === currentSessionId,
            }),
        );
    }

    /**
     * Limpia sesiones expiradas (puede ejecutarse como cron job)
     */
    async cleanupExpiredSessions(): Promise<number> {
        const result = await this.sessionRepository
            .createQueryBuilder()
            .delete()
            .where('expiresAt < :now', { now: new Date() })
            .execute();

        return result.affected || 0;
    }

    /**
     * Revoca todas las sesiones de un usuario (útil cuando se cambia contraseña)
     */
    async revokeAllUserSessions(userId: string): Promise<number> {
        const result = await this.sessionRepository.delete({ userId });
        return result.affected || 0;
    }

    /**
     * Encuentra una sesión por ID
     */
    async findById(sessionId: string): Promise<Session | null> {
        return this.sessionRepository.findOne({ where: { id: sessionId } });
    }
}
