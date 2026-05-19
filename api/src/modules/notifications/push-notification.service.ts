import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { DeviceTokenService } from './device-token.service';
import { PushNotificationPayload, FCMResponse } from './interfaces';

@Injectable()
export class PushNotificationService {
    private readonly logger = new Logger(PushNotificationService.name);
    private readonly maxRetries = 3;
    private readonly retryDelay = 1000; // ms

    constructor(
        private deviceTokenService: DeviceTokenService,
        private configService: ConfigService,
    ) {
        // Inicializar Firebase Admin SDK
        if (!admin.apps.length) {
            const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
            const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
            const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');

            if (!projectId || !clientEmail || !privateKey) {
                this.logger.warn('Firebase credentials not configured. Push notifications will not work.');
            } else {
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId,
                        clientEmail,
                        privateKey,
                    }),
                });
                this.logger.log('Firebase Admin SDK initialized successfully');
            }
        }
    }

    async sendToEmployee(
        employeeId: string,
        payload: PushNotificationPayload,
    ): Promise<void> {
        const tokens = await this.deviceTokenService.getActiveTokens(employeeId);

        if (tokens.length === 0) {
            this.logger.debug(`No active tokens for employee ${employeeId}`);
            return;
        }

        const sendPromises = tokens.map((token) =>
            this.sendToToken(token.fcmToken, payload).catch((error) => {
                this.logger.error(
                    `Failed to send to token ${token.id}: ${error.message}`,
                );

                // Marcar token como inactivo si es inválido
                if (this.isInvalidTokenError(error)) {
                    return this.deviceTokenService.markTokenInactive(
                        token.fcmToken,
                    );
                }
            }),
        );

        await Promise.allSettled(sendPromises);
    }

    async sendToToken(
        fcmToken: string,
        payload: PushNotificationPayload,
        attempt: number = 1,
    ): Promise<FCMResponse> {
        try {
            const message: admin.messaging.Message = {
                token: fcmToken,
                notification: payload.notification,
                data: payload.data,
                android: {
                    priority: 'high',
                    notification: {
                        sound: 'default',
                        clickAction: 'FLUTTER_NOTIFICATION_CLICK',
                    },
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                            badge: 1,
                        },
                    },
                },
                webpush: {
                    headers: { Urgency: 'high' },
                    // Sin notification field: el SW maneja la notificación via onBackgroundMessage
                    data: {
                        title: payload.notification.title,
                        body: payload.notification.body,
                        ...payload.data,
                    },
                    fcmOptions: {
                        link: '/',
                    },
                },
            };

            const messageId = await admin.messaging().send(message);

            this.logger.debug(`Successfully sent message: ${messageId}`);
            return { success: true, messageId };
        } catch (error) {
            // Reintentar en caso de errores temporales
            if (this.isRetryableError(error) && attempt < this.maxRetries) {
                const delay = this.retryDelay * Math.pow(2, attempt - 1);
                await this.sleep(delay);
                return this.sendToToken(fcmToken, payload, attempt + 1);
            }

            throw error;
        }
    }

    async sendTestNotification(
        employeeId: string,
        fcmToken: string,
    ): Promise<void> {
        const payload: PushNotificationPayload = {
            notification: {
                title: 'Notificación de Prueba',
                body: 'Las notificaciones push están funcionando correctamente',
            },
            data: {
                notificationId: 'test',
                type: 'TEST',
            },
        };

        await this.sendToToken(fcmToken, payload);
    }

    private isInvalidTokenError(error: any): boolean {
        const invalidErrorCodes = [
            'messaging/invalid-registration-token',
            'messaging/registration-token-not-registered',
        ];
        return invalidErrorCodes.includes(error.code);
    }

    private isRetryableError(error: any): boolean {
        const retryableErrorCodes = [
            'messaging/internal-error',
            'messaging/server-unavailable',
            'messaging/timeout',
        ];
        return retryableErrorCodes.includes(error.code);
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
