import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OnEvent } from '@nestjs/event-emitter';
import { MINUTE_PUBLISHED_EVENT } from '../minutes/minutes.service';
import { TasksRecapSyncService } from './tasks-recap-sync.service';
import { TasksGoogleSyncService } from './tasks-google-sync.service';

/**
 * Programación de la sincronización de tareas:
 * - Cada 15 minutos: compromisos modificados en recapmeeting, envío pendiente a Google y cambios hechos en Google.
 * - Cada día a las 3:30: todos los compromisos (corrige cambios que recapmeeting no marca como modificados).
 * - Al publicar un acta desde My Strategee: sus compromisos pasan a ser tareas en seguida.
 */
@Injectable()
export class TasksSyncScheduler {
    private readonly logger = new Logger(TasksSyncScheduler.name);

    constructor(
        private readonly recapSync: TasksRecapSyncService,
        private readonly googleSync: TasksGoogleSyncService,
    ) { }

    @Cron('*/15 * * * *', { name: 'tasks-sync' })
    async syncEveryQuarterHour(): Promise<void> {
        await this.run(false);
    }

    @Cron('30 3 * * *', { name: 'tasks-full-sync' })
    async syncDaily(): Promise<void> {
        await this.run(true);
    }

    @OnEvent(MINUTE_PUBLISHED_EVENT, { async: true })
    async onMinutePublished(): Promise<void> {
        try {
            await this.recapSync.sync(false);
            await this.googleSync.pushPending();
        } catch (error) {
            this.logger.warn(`No se pudieron sincronizar los compromisos del acta publicada: ${error}`);
        }
    }

    private async run(full: boolean): Promise<void> {
        try {
            await this.recapSync.sync(full);
        } catch (error) {
            this.logger.warn(`Falló la sincronización con recapmeeting: ${error}`);
        }
        try {
            await this.googleSync.pushPending();
            await this.googleSync.pullAll();
        } catch (error) {
            this.logger.warn(`Falló la sincronización con Google Tasks: ${error}`);
        }
    }
}
