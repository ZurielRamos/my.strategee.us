import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { DeviceTokenService } from '../device-token.service';

/**
 * Scheduler para limpieza automática de tokens de dispositivos inactivos
 * Ejecuta diariamente a las 3 AM para eliminar tokens inactivos
 * más antiguos que el período de retención configurado
 */
@Injectable()
export class TokenCleanupScheduler {
    private readonly logger = new Logger(TokenCleanupScheduler.name);

    constructor(
        private readonly deviceTokenService: DeviceTokenService,
        private readonly configService: ConfigService,
    ) {}

    /**
     * Tarea programada que se ejecuta diariamente a las 3 AM
     * Lee la configuración PUSH_TOKEN_RETENTION_DAYS (default: 30)
     * y elimina tokens inactivos más antiguos que ese período
     */
    @Cron('0 3 * * *', {
        name: 'token-cleanup',
        timeZone: 'America/Mexico_City',
    })
    async handleCleanup() {
        this.logger.log('Iniciando limpieza de tokens inactivos');

        try {
            // Obtener días de retención desde configuración (default: 30)
            const retentionDays = this.configService.get<number>(
                'PUSH_TOKEN_RETENTION_DAYS',
                30,
            );

            this.logger.log(
                `Eliminando tokens inactivos con más de ${retentionDays} días`,
            );

            // Llamar a deleteInactiveTokens
            const deletedCount =
                await this.deviceTokenService.deleteInactiveTokens(retentionDays);

            // Registrar cantidad de tokens eliminados en logs
            this.logger.log(
                `Limpieza completada: ${deletedCount} tokens eliminados`,
            );
        } catch (error) {
            this.logger.error(
                'Error durante la limpieza de tokens',
                error instanceof Error ? error.stack : String(error),
            );
        }
    }
}
