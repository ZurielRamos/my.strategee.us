import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as fc from 'fast-check';
import * as admin from 'firebase-admin';
import { PushNotificationService } from './push-notification.service';
import { PushNotificationPayload } from './interfaces';
import { DeviceTokenService } from './device-token.service';
import { Platform } from './enums/platform.enum';

// Mock firebase-admin
const mockApps: any[] = [];
const mockMessagingInstance = {
    send: jest.fn(),
};

jest.mock('firebase-admin', () => ({
    get apps() {
        return mockApps;
    },
    initializeApp: jest.fn(),
    credential: {
        cert: jest.fn(),
    },
    messaging: jest.fn(() => mockMessagingInstance),
}));

describe('PushNotificationService', () => {
    let service: PushNotificationService;
    let deviceTokenService: DeviceTokenService;
    let configService: ConfigService;
    let mockMessaging: any;

    beforeEach(async () => {
        // Reset mocks
        jest.clearAllMocks();
        mockApps.length = 0;
        
        mockMessaging = mockMessagingInstance;
        mockMessaging.send.mockReset();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PushNotificationService,
                {
                    provide: DeviceTokenService,
                    useValue: {
                        getActiveTokens: jest.fn(),
                        markTokenInactive: jest.fn(),
                    },
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string) => {
                            const config: Record<string, string> = {
                                FIREBASE_PROJECT_ID: 'test-project',
                                FIREBASE_CLIENT_EMAIL: 'test@test.iam.gserviceaccount.com',
                                FIREBASE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----\n',
                            };
                            return config[key];
                        }),
                    },
                },
            ],
        }).compile();

        service = module.get<PushNotificationService>(PushNotificationService);
        deviceTokenService = module.get<DeviceTokenService>(DeviceTokenService);
        configService = module.get<ConfigService>(ConfigService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    /**
     * Feature: firebase-push-notifications
     * **Validates: Requirements 4.2, 4.3, 4.4**
     * 
     * Property 10: Estructura Completa del Mensaje Push
     * 
     * Para cualquier notificación push enviada, el mensaje debe contener un título,
     * un cuerpo con detalles de la solicitud, y el identificador de la solicitud
     * en el payload de datos.
     */
    describe('Property 10: Complete Push Message Structure', () => {
        it('should construct message with notification title, body, and data payload for any input', async () => {
            await fc.assert(
                fc.asyncProperty(
                    // Generador de FCM token
                    fc.string({ minLength: 100, maxLength: 200 }),
                    // Generador de título
                    fc.string({ minLength: 1, maxLength: 100 }),
                    // Generador de cuerpo
                    fc.string({ minLength: 1, maxLength: 500 }),
                    // Generador de notification ID
                    fc.integer({ min: 1, max: 100000 }).map(String),
                    // Generador de request ID (opcional)
                    fc.option(fc.integer({ min: 1, max: 100000 }).map(String), { nil: undefined }),
                    // Generador de tipo
                    fc.constantFrom('REQUEST_STATUS_CHANGE', 'TEST', 'GENERAL'),
                    async (fcmToken, title, body, notificationId, requestId, type) => {
                        // Arrange
                        const payload: PushNotificationPayload = {
                            notification: {
                                title,
                                body,
                            },
                            data: {
                                notificationId,
                                requestId,
                                type,
                            },
                        };

                        mockMessaging.send.mockResolvedValue('message-id-123');

                        // Act
                        await service.sendToToken(fcmToken, payload);

                        // Assert: Verify message structure
                        expect(mockMessaging.send).toHaveBeenCalledWith(
                            expect.objectContaining({
                                token: fcmToken,
                                notification: expect.objectContaining({
                                    title,
                                    body,
                                }),
                                data: expect.objectContaining({
                                    notificationId,
                                    type,
                                }),
                            }),
                        );

                        // Verify notification contains title and body
                        const sentMessage = mockMessaging.send.mock.calls[0][0];
                        expect(sentMessage.notification.title).toBe(title);
                        expect(sentMessage.notification.body).toBe(body);

                        // Verify data payload contains required fields
                        expect(sentMessage.data.notificationId).toBe(notificationId);
                        expect(sentMessage.data.type).toBe(type);
                        if (requestId) {
                            expect(sentMessage.data.requestId).toBe(requestId);
                        }
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should include platform-specific configurations for any message', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.string({ minLength: 100, maxLength: 200 }),
                    fc.string({ minLength: 1, maxLength: 100 }),
                    fc.string({ minLength: 1, maxLength: 500 }),
                    fc.integer({ min: 1 }).map(String),
                    async (fcmToken, title, body, notificationId) => {
                        const payload: PushNotificationPayload = {
                            notification: { title, body },
                            data: { notificationId, type: 'TEST' },
                        };

                        mockMessaging.send.mockResolvedValue('message-id');

                        await service.sendToToken(fcmToken, payload);

                        const sentMessage = mockMessaging.send.mock.calls[0][0];

                        // Verify Android configuration
                        expect(sentMessage.android).toBeDefined();
                        expect(sentMessage.android.priority).toBe('high');
                        expect(sentMessage.android.notification.sound).toBe('default');

                        // Verify APNs configuration
                        expect(sentMessage.apns).toBeDefined();
                        expect(sentMessage.apns.payload.aps.sound).toBe('default');
                        expect(sentMessage.apns.payload.aps.badge).toBe(1);

                        // Verify WebPush configuration
                        expect(sentMessage.webpush).toBeDefined();
                        expect(sentMessage.webpush.notification.icon).toBeDefined();
                        expect(sentMessage.webpush.notification.badge).toBeDefined();
                    },
                ),
                { numRuns: 100 },
            );
        });
    });

    /**
     * Feature: firebase-push-notifications
     * **Validates: Requirements 10.1**
     * 
     * Property 18: Reintentos con Backoff Exponencial
     * 
     * Para cualquier error de rate limit de FCM, el sistema debe implementar
     * lógica de reintento con backoff exponencial.
     */
    describe('Property 18: Retry with Exponential Backoff', () => {
        it('should retry with exponentially increasing delays for retryable errors', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.string({ minLength: 100, maxLength: 200 }),
                    fc.constantFrom(
                        'messaging/internal-error',
                        'messaging/server-unavailable',
                        'messaging/timeout',
                    ),
                    async (fcmToken, errorCode) => {
                        const payload: PushNotificationPayload = {
                            notification: { title: 'Test', body: 'Test body' },
                            data: { notificationId: '1', type: 'TEST' },
                        };

                        const error = { code: errorCode, message: 'Test error' };

                        // Mock to fail twice then succeed
                        mockMessaging.send
                            .mockRejectedValueOnce(error)
                            .mockRejectedValueOnce(error)
                            .mockResolvedValueOnce('message-id');

                        const startTime = Date.now();
                        await service.sendToToken(fcmToken, payload);
                        const endTime = Date.now();

                        // Verify retries occurred (should take at least 1000ms + 2000ms = 3000ms)
                        const duration = endTime - startTime;
                        expect(duration).toBeGreaterThanOrEqual(2900); // Allow small margin

                        // Verify send was called 3 times (initial + 2 retries)
                        expect(mockMessaging.send).toHaveBeenCalledTimes(3);
                    },
                ),
                { numRuns: 20, timeout: 15000 }, // Increased timeout
            );
        }, 20000); // Jest timeout

        it('should respect maximum retry limit for any retryable error', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.string({ minLength: 100, maxLength: 200 }),
                    fc.constantFrom(
                        'messaging/internal-error',
                        'messaging/server-unavailable',
                        'messaging/timeout',
                    ),
                    async (fcmToken, errorCode) => {
                        const payload: PushNotificationPayload = {
                            notification: { title: 'Test', body: 'Test' },
                            data: { notificationId: '1', type: 'TEST' },
                        };

                        const error = { code: errorCode, message: 'Persistent error' };
                        mockMessaging.send.mockRejectedValue(error);

                        await expect(
                            service.sendToToken(fcmToken, payload),
                        ).rejects.toThrow();

                        // Verify max retries (3 attempts total)
                        expect(mockMessaging.send).toHaveBeenCalledTimes(3);
                    },
                ),
                { numRuns: 20, timeout: 20000 },
            );
        }, 25000); // Jest timeout
    });

    /**
     * Feature: firebase-push-notifications
     * **Validates: Requirements 4.1**
     * 
     * Property 9: Envío a Todos los Tokens Activos
     * 
     * Para cualquier notificación creada por el Notification_System, el sistema
     * debe enviar notificaciones push a todos los tokens activos asociados con
     * el empleado destinatario.
     */
    describe('Property 9: Send to All Active Tokens', () => {
        it('should send notification to all active tokens for any employee', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.uuid(),
                    fc.array(
                        fc.record({
                            id: fc.integer({ min: 1, max: 1000 }),
                            fcmToken: fc.string({ minLength: 100, maxLength: 200 }),
                            platform: fc.constantFrom(Platform.WEB, Platform.ANDROID, Platform.IOS),
                            active: fc.constant(true),
                        }),
                        { minLength: 1, maxLength: 5 },
                    ),
                    async (employeeId, tokens) => {
                        const payload: PushNotificationPayload = {
                            notification: { title: 'Test', body: 'Test notification' },
                            data: { notificationId: '1', type: 'TEST' },
                        };

                        const mockTokens = tokens.map((t) => ({
                            ...t,
                            employeeId,
                            lastUsedAt: new Date(),
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        }));

                        jest.spyOn(deviceTokenService, 'getActiveTokens').mockResolvedValue(
                            mockTokens as any,
                        );
                        mockMessaging.send.mockResolvedValue('message-id');

                        await service.sendToEmployee(employeeId, payload);

                        // Verify send was called for each token
                        expect(mockMessaging.send).toHaveBeenCalledTimes(tokens.length);

                        // Verify each token received the notification
                        tokens.forEach((token, index) => {
                            expect(mockMessaging.send).toHaveBeenNthCalledWith(
                                index + 1,
                                expect.objectContaining({
                                    token: token.fcmToken,
                                }),
                            );
                        });
                    },
                ),
                { numRuns: 100 },
            );
        });
    });

    /**
     * Feature: firebase-push-notifications
     * **Validates: Requirements 4.5**
     * 
     * Property 11: Resiliencia ante Fallos Parciales
     * 
     * Para cualquier conjunto de tokens donde uno o más fallan al enviar,
     * el sistema debe registrar los errores y continuar enviando a los
     * tokens restantes sin interrumpir el proceso.
     */
    describe('Property 11: Resilience Against Partial Failures', () => {
        it('should continue sending to remaining tokens when some fail', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.uuid(),
                    fc.array(
                        fc.record({
                            id: fc.integer({ min: 1, max: 1000 }),
                            fcmToken: fc.string({ minLength: 100, maxLength: 200 }),
                            platform: fc.constantFrom(Platform.WEB, Platform.ANDROID, Platform.IOS),
                            active: fc.constant(true),
                            shouldFail: fc.boolean(),
                        }),
                        { minLength: 2, maxLength: 5 },
                    ),
                    async (employeeId, tokens) => {
                        // Ensure at least one token fails
                        fc.pre(tokens.some((t) => t.shouldFail));

                        const payload: PushNotificationPayload = {
                            notification: { title: 'Test', body: 'Test' },
                            data: { notificationId: '1', type: 'TEST' },
                        };

                        const mockTokens = tokens.map((t) => ({
                            ...t,
                            employeeId,
                            lastUsedAt: new Date(),
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        }));

                        jest.spyOn(deviceTokenService, 'getActiveTokens').mockResolvedValue(
                            mockTokens as any,
                        );

                        // Mock send to fail for some tokens
                        mockMessaging.send.mockImplementation((message: any) => {
                            const token = tokens.find((t) => t.fcmToken === message.token);
                            if (token?.shouldFail) {
                                return Promise.reject({
                                    code: 'messaging/invalid-registration-token',
                                    message: 'Invalid token',
                                });
                            }
                            return Promise.resolve('message-id');
                        });

                        // Should not throw error
                        await expect(
                            service.sendToEmployee(employeeId, payload),
                        ).resolves.not.toThrow();

                        // Verify send was attempted for all tokens
                        expect(mockMessaging.send).toHaveBeenCalledTimes(tokens.length);

                        // Verify failed tokens were marked inactive
                        const failedTokens = tokens.filter((t) => t.shouldFail);
                        expect(deviceTokenService.markTokenInactive).toHaveBeenCalledTimes(
                            failedTokens.length,
                        );
                    },
                ),
                { numRuns: 100 },
            );
        });
    });

    describe('Unit Tests - Error Handling', () => {
        describe('Invalid Token Errors', () => {
            it('should detect invalid registration token error', async () => {
                const fcmToken = 'invalid-token';
                const payload: PushNotificationPayload = {
                    notification: { title: 'Test', body: 'Test' },
                    data: { notificationId: '1', type: 'TEST' },
                };

                mockMessaging.send.mockRejectedValue({
                    code: 'messaging/invalid-registration-token',
                    message: 'Invalid token',
                });

                // Should throw when called directly (not caught)
                await expect(service.sendToToken(fcmToken, payload)).rejects.toMatchObject({
                    code: 'messaging/invalid-registration-token',
                });
            });

            it('should detect unregistered token error', async () => {
                const fcmToken = 'unregistered-token';
                const payload: PushNotificationPayload = {
                    notification: { title: 'Test', body: 'Test' },
                    data: { notificationId: '1', type: 'TEST' },
                };

                mockMessaging.send.mockRejectedValue({
                    code: 'messaging/registration-token-not-registered',
                    message: 'Token not registered',
                });

                // Should throw when called directly (not caught)
                await expect(service.sendToToken(fcmToken, payload)).rejects.toMatchObject({
                    code: 'messaging/registration-token-not-registered',
                });
            });

            it('should mark invalid tokens as inactive', async () => {
                const employeeId = 'employee-123';
                const tokens = [
                    {
                        id: 1,
                        employeeId,
                        fcmToken: 'invalid-token',
                        platform: Platform.WEB,
                        active: true,
                        lastUsedAt: new Date(),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                ];

                jest.spyOn(deviceTokenService, 'getActiveTokens').mockResolvedValue(tokens);
                mockMessaging.send.mockRejectedValue({
                    code: 'messaging/invalid-registration-token',
                    message: 'Invalid token',
                });

                await service.sendToEmployee(employeeId, {
                    notification: { title: 'Test', body: 'Test' },
                    data: { notificationId: '1', type: 'TEST' },
                });

                expect(deviceTokenService.markTokenInactive).toHaveBeenCalledWith(
                    'invalid-token',
                );
            });
        });

        describe('Retryable Errors', () => {
            it('should retry on internal error', async () => {
                const fcmToken = 'test-token';
                const payload: PushNotificationPayload = {
                    notification: { title: 'Test', body: 'Test' },
                    data: { notificationId: '1', type: 'TEST' },
                };

                mockMessaging.send
                    .mockRejectedValueOnce({
                        code: 'messaging/internal-error',
                        message: 'Internal error',
                    })
                    .mockResolvedValueOnce('message-id');

                const result = await service.sendToToken(fcmToken, payload);

                expect(result.success).toBe(true);
                expect(mockMessaging.send).toHaveBeenCalledTimes(2);
            }, 10000);

            it('should retry on server unavailable error', async () => {
                const fcmToken = 'test-token';
                const payload: PushNotificationPayload = {
                    notification: { title: 'Test', body: 'Test' },
                    data: { notificationId: '1', type: 'TEST' },
                };

                mockMessaging.send
                    .mockRejectedValueOnce({
                        code: 'messaging/server-unavailable',
                        message: 'Server unavailable',
                    })
                    .mockResolvedValueOnce('message-id');

                const result = await service.sendToToken(fcmToken, payload);

                expect(result.success).toBe(true);
                expect(mockMessaging.send).toHaveBeenCalledTimes(2);
            }, 10000);

            it('should retry on timeout error', async () => {
                const fcmToken = 'test-token';
                const payload: PushNotificationPayload = {
                    notification: { title: 'Test', body: 'Test' },
                    data: { notificationId: '1', type: 'TEST' },
                };

                mockMessaging.send
                    .mockRejectedValueOnce({
                        code: 'messaging/timeout',
                        message: 'Timeout',
                    })
                    .mockResolvedValueOnce('message-id');

                const result = await service.sendToToken(fcmToken, payload);

                expect(result.success).toBe(true);
                expect(mockMessaging.send).toHaveBeenCalledTimes(2);
            }, 10000);

            it('should respect retry limit', async () => {
                const fcmToken = 'test-token';
                const payload: PushNotificationPayload = {
                    notification: { title: 'Test', body: 'Test' },
                    data: { notificationId: '1', type: 'TEST' },
                };

                mockMessaging.send.mockRejectedValue({
                    code: 'messaging/internal-error',
                    message: 'Persistent error',
                });

                await expect(service.sendToToken(fcmToken, payload)).rejects.toMatchObject({
                    code: 'messaging/internal-error',
                });

                // Should try 3 times (initial + 2 retries)
                expect(mockMessaging.send).toHaveBeenCalledTimes(3);
            }, 15000);
        });
    });

    describe('sendToEmployee', () => {
        it('should handle employee with no active tokens', async () => {
            const employeeId = 'employee-no-tokens';
            const payload: PushNotificationPayload = {
                notification: { title: 'Test', body: 'Test' },
                data: { notificationId: '1', type: 'TEST' },
            };

            jest.spyOn(deviceTokenService, 'getActiveTokens').mockResolvedValue([]);

            await service.sendToEmployee(employeeId, payload);

            expect(mockMessaging.send).not.toHaveBeenCalled();
        });

        it('should send to all active tokens', async () => {
            const employeeId = 'employee-123';
            const tokens = [
                {
                    id: 1,
                    employeeId,
                    fcmToken: 'token-1',
                    platform: Platform.WEB,
                    active: true,
                    lastUsedAt: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 2,
                    employeeId,
                    fcmToken: 'token-2',
                    platform: Platform.ANDROID,
                    active: true,
                    lastUsedAt: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            jest.spyOn(deviceTokenService, 'getActiveTokens').mockResolvedValue(tokens);
            mockMessaging.send.mockResolvedValue('message-id');

            await service.sendToEmployee(employeeId, {
                notification: { title: 'Test', body: 'Test' },
                data: { notificationId: '1', type: 'TEST' },
            });

            expect(mockMessaging.send).toHaveBeenCalledTimes(2);
        });
    });

    describe('sendTestNotification', () => {
        it('should send test notification with predefined content', async () => {
            const employeeId = 'employee-123';
            const fcmToken = 'test-token';

            mockMessaging.send.mockResolvedValue('message-id');

            await service.sendTestNotification(employeeId, fcmToken);

            expect(mockMessaging.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    token: fcmToken,
                    notification: expect.objectContaining({
                        title: 'Notificación de Prueba',
                        body: 'Las notificaciones push están funcionando correctamente',
                    }),
                    data: expect.objectContaining({
                        notificationId: 'test',
                        type: 'TEST',
                    }),
                }),
            );
        });
    });
});
