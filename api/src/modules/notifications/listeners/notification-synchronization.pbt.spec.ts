import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fc from 'fast-check';
import { NotificationCreatedListener } from './notification-created.listener';
import { PushNotificationService } from '../push-notification.service';
import { PushNotificationPayload } from '../interfaces';
import { Notification } from '../entities/notification.entity';
import { NotificationType } from '../enums/notification-type.enum';
import { NotificationStatus } from '../enums/notification-status.enum';

/**
 * Feature: firebase-push-notifications
 * Property 14: Sincronización con Sistema de Notificaciones
 * 
 * Para cualquier notificación push enviada, debe existir una notificación
 * correspondiente en el Notification_System con el mismo mensaje y metadata.
 * 
 * Valida: Requisitos 7.1, 15.2
 */
describe('Property 14: Notification System Synchronization', () => {
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
    const metadataArbitrary = () =>
        fc.record({
            requestType: fc.constantFrom('VACATION', 'DOCUMENT', 'MEETING'),
            previousStatus: fc.constantFrom('PENDING', 'APPROVED', 'REJECTED'),
            newStatus: fc.constantFrom('PENDING', 'APPROVED', 'REJECTED'),
        });

    const notificationArbitrary = () =>
        fc.record({
            id: notificationIdArbitrary(),
            type: fc.constant(NotificationType.REQUEST_STATUS_CHANGE),
            message: messageArbitrary(),
            employeeId: employeeIdArbitrary(),
            requestId: requestIdArbitrary(),
            status: fc.constant(NotificationStatus.UNREAD),
            metadata: metadataArbitrary(),
            createdAt: fc.date(),
        });

    it('should ensure push notification payload matches notification system data', async () => {
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

                    // Assert - Verificar que se envió push notification
                    expect(mockPushNotificationService.sendToEmployee).toHaveBeenCalled();

                    // Assert - Verificar sincronización de datos
                    const callArgs = mockPushNotificationService.sendToEmployee.mock.calls[0];
                    const [employeeId, payload] = callArgs as [string, PushNotificationPayload];

                    // El employeeId debe coincidir
                    expect(employeeId).toBe(notification.employeeId);

                    // El mensaje debe coincidir exactamente
                    expect(payload.notification.body).toBe(notification.message);

                    // Los datos deben incluir el ID de notificación correcto
                    expect(payload.data.notificationId).toBe(notification.id.toString());

                    // El tipo debe coincidir
                    expect(payload.data.type).toBe(notification.type);

                    // El requestId debe coincidir (si existe)
                    if (notification.requestId !== null) {
                        expect(payload.data.requestId).toBe(notification.requestId.toString());
                    }
                },
            ),
            { numRuns: 100 },
        );
    });

    it('should only send push notifications for notifications that exist in the system', async () => {
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

                    // Assert - Debe buscar la notificación en el sistema primero
                    expect(mockNotificationRepository.findOne).toHaveBeenCalledWith({
                        where: { id: notification.id },
                        relations: ['request'],
                    });

                    // Assert - Solo debe enviar si la notificación existe
                    expect(mockPushNotificationService.sendToEmployee).toHaveBeenCalledTimes(1);
                },
            ),
            { numRuns: 100 },
        );
    });

    it('should not send push notification if notification does not exist in system', async () => {
        await fc.assert(
            fc.asyncProperty(
                notificationIdArbitrary(),
                async (notificationId) => {
                    // Arrange - Reset mocks for each iteration
                    mockNotificationRepository.findOne.mockReset();
                    mockPushNotificationService.sendToEmployee.mockReset();
                    
                    // Notificación no existe en el sistema
                    mockNotificationRepository.findOne.mockResolvedValue(null);

                    // Act
                    await listener.handleNotificationCreated({ notificationId });

                    // Assert - Debe buscar la notificación
                    expect(mockNotificationRepository.findOne).toHaveBeenCalledWith({
                        where: { id: notificationId },
                        relations: ['request'],
                    });

                    // Assert - NO debe enviar push notification si no existe
                    expect(mockPushNotificationService.sendToEmployee).not.toHaveBeenCalled();
                },
            ),
            { numRuns: 100 },
        );
    });

    it('should preserve notification message integrity in push payload', async () => {
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

                    // Assert - El mensaje no debe ser modificado
                    const callArgs = mockPushNotificationService.sendToEmployee.mock.calls[0];
                    const [, payload] = callArgs as [string, PushNotificationPayload];

                    // El mensaje debe ser exactamente el mismo (sin modificaciones)
                    expect(payload.notification.body).toBe(notification.message);
                    expect(payload.notification.body.length).toBe(notification.message.length);
                },
            ),
            { numRuns: 100 },
        );
    });

    it('should reuse notification data without duplicating logic', async () => {
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

                    // Assert - Debe obtener datos del sistema de notificaciones
                    expect(mockNotificationRepository.findOne).toHaveBeenCalled();

                    // Assert - Debe reutilizar los datos obtenidos
                    const callArgs = mockPushNotificationService.sendToEmployee.mock.calls[0];
                    const [employeeId, payload] = callArgs as [string, PushNotificationPayload];

                    // Todos los datos deben venir de la notificación del sistema
                    expect(employeeId).toBe(notification.employeeId);
                    expect(payload.notification.body).toBe(notification.message);
                    expect(payload.data.type).toBe(notification.type);
                    expect(payload.data.notificationId).toBe(notification.id.toString());
                },
            ),
            { numRuns: 100 },
        );
    });
});
