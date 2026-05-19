import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fc from 'fast-check';
import { NotificationCreatedListener } from './notification-created.listener';
import { PushNotificationService } from '../push-notification.service';
import { Notification } from '../entities/notification.entity';
import { NotificationType } from '../enums/notification-type.enum';
import { NotificationStatus } from '../enums/notification-status.enum';

/**
 * Feature: firebase-push-notifications
 * Property 25: Escucha de Eventos de Notificación
 * 
 * Para cualquier evento notification.created emitido por el Notification_System,
 * el Push_Notification_System debe recibir y procesar ese evento.
 * 
 * Valida: Requisitos 15.1
 */
describe('Property 25: Event Listening', () => {
    let listener: NotificationCreatedListener;
    let pushNotificationService: PushNotificationService;
    let notificationRepository: Repository<Notification>;

    const mockPushNotificationService = {
        sendToEmployee: jest.fn(),
    };

    const mockNotificationRepository = {
        findOne: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationCreatedListener,
                {
                    provide: PushNotificationService,
                    useValue: mockPushNotificationService,
                },
                {
                    provide: getRepositoryToken(Notification),
                    useValue: mockNotificationRepository,
                },
            ],
        }).compile();

        listener = module.get<NotificationCreatedListener>(NotificationCreatedListener);
        pushNotificationService = module.get<PushNotificationService>(PushNotificationService);
        notificationRepository = module.get<Repository<Notification>>(
            getRepositoryToken(Notification),
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // Generadores (Arbitraries)
    const notificationIdArbitrary = () => fc.integer({ min: 1, max: 1000000 });
    const employeeIdArbitrary = () => fc.uuid();
    const messageArbitrary = () => fc.string({ minLength: 10, maxLength: 200 });
    const requestIdArbitrary = () => fc.option(fc.integer({ min: 1, max: 1000000 }), { nil: null });

    const notificationArbitrary = () =>
        fc.record({
            id: notificationIdArbitrary(),
            type: fc.constant(NotificationType.REQUEST_STATUS_CHANGE),
            message: messageArbitrary(),
            employeeId: employeeIdArbitrary(),
            requestId: requestIdArbitrary(),
            status: fc.constant(NotificationStatus.UNREAD),
            metadata: fc.constant({}),
            createdAt: fc.date(),
        });

    it('should process any notification.created event and attempt to send push notification', async () => {
        await fc.assert(
            fc.asyncProperty(
                notificationArbitrary(),
                async (notification) => {
                    // Arrange - Reset mocks for each iteration
                    mockNotificationRepository.findOne.mockReset();
                    mockPushNotificationService.sendToEmployee.mockReset();
                    
                    mockNotificationRepository.findOne.mockResolvedValue(notification);
                    mockPushNotificationService.sendToEmployee.mockResolvedValue(undefined);

                    // Act
                    await listener.handleNotificationCreated({
                        notificationId: notification.id,
                    });

                    // Assert - El listener debe procesar el evento
                    expect(mockNotificationRepository.findOne).toHaveBeenCalledWith({
                        where: { id: notification.id },
                        relations: ['request'],
                    });

                    // Assert - Debe intentar enviar push notification
                    expect(mockPushNotificationService.sendToEmployee).toHaveBeenCalledWith(
                        notification.employeeId,
                        expect.objectContaining({
                            notification: expect.objectContaining({
                                title: expect.any(String),
                                body: notification.message,
                            }),
                            data: expect.objectContaining({
                                notificationId: notification.id.toString(),
                                type: notification.type,
                            }),
                        }),
                    );
                },
            ),
            { numRuns: 100 },
        );
    });

    it('should handle any notification ID gracefully even if not found', async () => {
        await fc.assert(
            fc.asyncProperty(
                notificationIdArbitrary(),
                async (notificationId) => {
                    // Arrange - Reset mocks for each iteration
                    mockNotificationRepository.findOne.mockReset();
                    mockPushNotificationService.sendToEmployee.mockReset();
                    
                    mockNotificationRepository.findOne.mockResolvedValue(null);

                    // Act & Assert - No debe lanzar error
                    await expect(
                        listener.handleNotificationCreated({ notificationId }),
                    ).resolves.not.toThrow();

                    // Assert - Debe buscar la notificación
                    expect(mockNotificationRepository.findOne).toHaveBeenCalledWith({
                        where: { id: notificationId },
                        relations: ['request'],
                    });

                    // Assert - No debe intentar enviar si no encuentra la notificación
                    expect(mockPushNotificationService.sendToEmployee).not.toHaveBeenCalled();
                },
            ),
            { numRuns: 100 },
        );
    });

    it('should construct payload with correct data structure for any notification', async () => {
        await fc.assert(
            fc.asyncProperty(
                notificationArbitrary(),
                async (notification) => {
                    // Arrange - Reset mocks for each iteration
                    mockNotificationRepository.findOne.mockReset();
                    mockPushNotificationService.sendToEmployee.mockReset();
                    
                    mockNotificationRepository.findOne.mockResolvedValue(notification);
                    mockPushNotificationService.sendToEmployee.mockResolvedValue(undefined);

                    // Act
                    await listener.handleNotificationCreated({
                        notificationId: notification.id,
                    });

                    // Assert - Verificar estructura del payload
                    const callArgs = mockPushNotificationService.sendToEmployee.mock.calls[0];
                    expect(callArgs).toBeDefined();
                    
                    const [employeeId, payload] = callArgs;
                    
                    // Verificar employeeId correcto
                    expect(employeeId).toBe(notification.employeeId);
                    
                    // Verificar estructura de notification
                    expect(payload.notification).toHaveProperty('title');
                    expect(payload.notification).toHaveProperty('body');
                    expect(payload.notification.body).toBe(notification.message);
                    
                    // Verificar estructura de data
                    expect(payload.data).toHaveProperty('notificationId');
                    expect(payload.data).toHaveProperty('requestId');
                    expect(payload.data).toHaveProperty('type');
                    expect(payload.data.notificationId).toBe(notification.id.toString());
                    expect(payload.data.type).toBe(notification.type);
                    
                    // Verificar requestId (puede ser string o vacío)
                    if (notification.requestId !== null) {
                        expect(payload.data.requestId).toBe(notification.requestId.toString());
                    } else {
                        expect(payload.data.requestId).toBe('');
                    }
                },
            ),
            { numRuns: 100 },
        );
    });
});
