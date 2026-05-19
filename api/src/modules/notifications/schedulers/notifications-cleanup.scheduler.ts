import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from '../notifications.service';

/**
 * Scheduler para limpieza automática de notificaciones antiguas
 * Ejecuta diariamente a las 2 AM para eliminar notificaciones
 * más antiguas que el período de retención configurado
 */
@Injectable()
export class NotificationsCleanupScheduler {
    private readonly logger = new Logger(NotificationsCleanupScheduler.name);

    constructor(
        private readonly notificationsService: NotificationsService,
        private readonly configService: ConfigService,
    ) {}

    /**
     * Tarea programada que se ejecuta diariamente a las 2 AM
     * Lee la configuración NOTIFICATIONS_RETENTION_DAYS (default: 90)
     * y elimina notificaciones más antiguas que ese período
     */
    @Cron('0 2 * * *', {
        name: 'notifications-cleanup',
        timeZone: 'America/Mexico_City',
    })
    async handleCleanup() {
        this.logger.log('Iniciando limpieza de notificaciones antiguas');

        try {
            // Leer configuración de días de retención (default: 90)
            const retentionDays = this.configService.get<number>(
                'NOTIFICATIONS_RETENTION_DAYS',
                90
            );

            this.logger.log(`Eliminando notificaciones con más de ${retentionDays} días`);

            // Ejecutar limpieza
            const deletedCount = await this.notificationsService
                .deleteOldNotifications(retentionDays);

            // Registrar resultado en logs
            this.logger.log(
                `Limpieza completada: ${deletedCount} notificaciones eliminadas`
            );
        } catch (error) {
            this.logger.error(
                'Error durante la limpieza de notificaciones',
                error instanceof Error ? error.stack : String(error)
            );
        }
    }
}
