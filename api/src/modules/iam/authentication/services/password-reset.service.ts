import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { UsersService } from '../../users/users.service';
import { HashingService } from '../../hashing/hashing.service';
import { MailService } from '@modules/infrastructure/mail/mail.service';
import { SessionsService } from './sessions.service';
import * as crypto from 'crypto';

@Injectable()
export class PasswordResetService {
    constructor(
        @InjectRepository(PasswordResetToken)
        private readonly resetTokenRepository: Repository<PasswordResetToken>,
        private readonly usersService: UsersService,
        private readonly hashingService: HashingService,
        private readonly mailService: MailService,
        private readonly sessionsService: SessionsService,
    ) { }


    /**
     * Solicita un reset de contraseña enviando un token por email
     */
    async requestPasswordReset(email: string): Promise<void> {
        // Find user by email
        const user = await this.usersService.findByEmail(email);

        // No revelar si el email existe o no (seguridad)
        if (!user) {
            // Esperar un tiempo similar para evitar timing attacks
            await new Promise(resolve => setTimeout(resolve, 100));
            return;
        }

        // Generate reset token (plain text)
        const resetToken = crypto.randomBytes(32).toString('hex');

        // Hash token for storage
        const hashedToken = await this.hashingService.hash(resetToken);

        // Set expiration time (1 hour from now)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);

        // Delete any existing reset tokens for this user
        await this.resetTokenRepository.delete({ userId: user.id });

        // Create new reset token
        await this.resetTokenRepository.save({
            userId: user.id,
            token: hashedToken,
            expiresAt,
        });

        // Send email with reset token
        await this.mailService.sendPasswordReset(
            user.email,
            resetToken,
            user.email, // Could use user.name if available
        );
    }

    /**
     * Resetea la contraseña usando el token
     */
    async resetPassword(token: string, newPassword: string): Promise<void> {
        // Find all non-expired tokens
        const tokens = await this.resetTokenRepository.find({
            where: {
                expiresAt: MoreThan(new Date()),
            },
            relations: ['user'],
        });

        // Find matching token by comparing hashes
        let matchingToken: PasswordResetToken | null = null;
        for (const dbToken of tokens) {
            const isMatch = await this.hashingService.compare(token, dbToken.token);
            if (isMatch) {
                matchingToken = dbToken;
                break;
            }
        }

        if (!matchingToken) {
            throw new BadRequestException('Token inválido o expirado');
        }

        // Check if token has expired
        if (matchingToken.expiresAt < new Date()) {
            await this.resetTokenRepository.delete(matchingToken.id);
            throw new BadRequestException('El token ha expirado');
        }

        // Update user password (UsersService handles hashing)
        await this.usersService.update(matchingToken.userId, {
            password: newPassword,
        });

        // Delete the used token
        await this.resetTokenRepository.delete(matchingToken.id);

        // Revoke all user sessions (force re-login)
        await this.sessionsService.revokeAllUserSessions(matchingToken.userId);
    }

    /**
     * Cambia la contraseña de un usuario autenticado
     */
    async changePassword(
        userId: string,
        currentPassword: string,
        newPassword: string,
    ): Promise<void> {
        // Get user
        const user = await this.usersService.findOne(userId);

        // Verify current password
        const isPasswordValid = await this.hashingService.compare(
            currentPassword,
            user.password,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException('Contraseña actual incorrecta');
        }

        // Update password (UsersService handles hashing)
        await this.usersService.update(userId, {
            password: newPassword,
        });

        // Revoke all sessions except current one
        // Note: We'd need to pass the current sessionId here for this to work properly
        await this.sessionsService.revokeAllUserSessions(userId);
    }

    /**
     * Envía email de bienvenida con token para configurar contraseña por primera vez
     * Usado cuando se crean credenciales de empleado
     */
    async sendFirstTimeSetupEmail(
        email: string,
        employeeName: string,
    ): Promise<void> {
        // Find user by email
        const user = await this.usersService.findByEmail(email);

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        // Generate reset token (plain text)
        const resetToken = crypto.randomBytes(32).toString('hex');

        // Hash token for storage
        const hashedToken = await this.hashingService.hash(resetToken);

        // Set expiration time (24 hours for first-time setup, longer than password reset)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        // Delete any existing reset tokens for this user
        await this.resetTokenRepository.delete({ userId: user.id });

        // Create new reset token
        await this.resetTokenRepository.save({
            userId: user.id,
            token: hashedToken,
            expiresAt,
        });

        // Send welcome email with password setup link
        await this.mailService.sendWelcomeWithPasswordSetup(
            email,
            employeeName,
            resetToken,
        );
    }

    /**
     * Limpia tokens expirados (puede ejecutarse como cron job)
     */
    async cleanupExpiredTokens(): Promise<number> {
        const result = await this.resetTokenRepository
            .createQueryBuilder()
            .delete()
            .where('expiresAt < :now', { now: new Date() })
            .execute();

        return result.affected || 0;
    }
}
