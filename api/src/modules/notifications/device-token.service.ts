import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceToken } from './entities/device-token.entity';
import { Platform } from './enums/platform.enum';

@Injectable()
export class DeviceTokenService {
    constructor(
        @InjectRepository(DeviceToken)
        private tokenRepository: Repository<DeviceToken>,
    ) {}

    async registerToken(
        employeeId: string,
        fcmToken: string,
        platform: Platform,
    ): Promise<DeviceToken> {
        // Buscar token existente
        let token = await this.tokenRepository.findOne({
            where: { fcmToken },
        });

        if (token) {
            // Reactivar si existe
            token.active = true;
            token.employeeId = employeeId;
            token.platform = platform;
            token.lastUsedAt = new Date();
        } else {
            // Crear nuevo
            token = this.tokenRepository.create({
                employeeId,
                fcmToken,
                platform,
                active: true,
                lastUsedAt: new Date(),
            });
        }

        return this.tokenRepository.save(token);
    }

    async updateToken(
        employeeId: string,
        oldToken: string,
        newToken: string,
    ): Promise<DeviceToken> {
        // Desactivar token antiguo
        await this.tokenRepository.update(
            { fcmToken: oldToken, employeeId },
            { active: false },
        );

        // Registrar nuevo token
        const existingToken = await this.tokenRepository.findOne({
            where: { fcmToken: oldToken },
        });

        return this.registerToken(
            employeeId,
            newToken,
            existingToken?.platform || Platform.WEB,
        );
    }

    async deactivateToken(employeeId: string, fcmToken: string): Promise<void> {
        await this.tokenRepository.update(
            { fcmToken, employeeId },
            { active: false },
        );
    }

    async deactivateAllTokensForEmployee(employeeId: string): Promise<void> {
        await this.tokenRepository.update(
            { employeeId, active: true },
            { active: false },
        );
    }

    async getActiveTokens(employeeId: string): Promise<DeviceToken[]> {
        return this.tokenRepository.find({
            where: { employeeId, active: true },
        });
    }

    async markTokenInactive(fcmToken: string): Promise<void> {
        await this.tokenRepository.update({ fcmToken }, { active: false });
    }

    async deleteInactiveTokens(daysInactive: number): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

        const result = await this.tokenRepository
            .createQueryBuilder()
            .delete()
            .where('active = :active', { active: false })
            .andWhere('updated_at < :cutoffDate', { cutoffDate })
            .execute();

        return result.affected || 0;
    }

    async getTokenStatus(
        employeeId: string,
        fcmToken: string,
    ): Promise<DeviceToken | null> {
        return this.tokenRepository.findOne({
            where: { employeeId, fcmToken },
        });
    }
}
