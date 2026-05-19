import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationCreatedListener } from './notification-created.listener';
import { PushNotificationService } from '../push-notification.service';
import { Notification } from '../entities/notification.entity';
import { NotificationType } from '../enums/notification-type.enum';
import { NotificationStatus } from '../enums/notification-status.enum';

describe('NotificationCreatedListener', () => {
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

    describe('handleNotificationCreated', () => {
        it('should construct correct payload and send push notification', async () => {
            // Arrange
            const notificationId = 1;
            const employeeId = 'employee-123';
            const requestId = 456;
            const message = 'Tu solicitud fue aprobada';

            const mockNotification: Partial<Notification> = {
                id: notificationId,
                type: NotificationType.REQUEST_STATUS_CHANGE,
                message,
                employeeId,
                requestId,
                status: NotificationStatus.UNREAD,
                metadata: {},
                createdAt: new Date(),
            };

            mockNotificationRepository.findOne.mockResolvedValue(mockNotification);

            // Act
            await listener.handleNotificationCreated({ notificationId });

            // Assert
            expect(mockNotificationRepository.findOne).toHaveBeenCalledWith({
                where: { id: notificationId },
                relations: ['request'],
            });

            expect(mockPushNotificationService.sendToEmployee).toHaveBeenCalledWith(
                employeeId,
                {
                    notification: {
                        title: 'Actualización de Solicitud',
                        body: message,
                    },
                    data: {
                        notificationId: notificationId.toString(),
                        requestId: requestId.toString(),
                        type: NotificationType.REQUEST_STATUS_CHANGE,
                    },
                },
            );
        });

        it('should handle notification not found gracefully', async () => {
            // Arrange
            const notificationId = 999;
            mockNotificationRepository.findOne.mockResolvedValue(null);

            // Act
            await listener.handleNotificationCreated({ notificationId });

            // Assert
            expect(mockNotificationRepository.findOne).toHaveBeenCalledWith({
                where: { id: notificationId },
                relations: ['request'],
            });

            expect(mockPushNotificationService.sendToEmployee).not.toHaveBeenCalled();
        });

        it('should handle notification without requestId', async () => {
            // Arrange
            const notificationId = 2;
            const employeeId = 'employee-456';

            const mockNotification: Partial<Notification> = {
                id: notificationId,
                type: NotificationType.REQUEST_STATUS_CHANGE,
                message: 'Notificación general',
                employeeId,
                requestId: null,
                status: NotificationStatus.UNREAD,
                metadata: {},
                createdAt: new Date(),
            };

            mockNotificationRepository.findOne.mockResolvedValue(mockNotification);

            // Act
            await listener.handleNotificationCreated({ notificationId });

            // Assert
            expect(mockPushNotificationService.sendToEmployee).toHaveBeenCalledWith(
                employeeId,
                expect.objectContaining({
                    data: expect.objectContaining({
                        requestId: '',
                    }),
                }),
            );
        });

        it('should not propagate errors from push notification service', async () => {
            // Arrange
            const notificationId = 3;
            const mockNotification: Partial<Notification> = {
                id: notificationId,
                type: NotificationType.REQUEST_STATUS_CHANGE,
                message: 'Test message',
                employeeId: 'employee-789',
                requestId: 123,
                status: NotificationStatus.UNREAD,
                metadata: {},
                createdAt: new Date(),
            };

            mockNotificationRepository.findOne.mockResolvedValue(mockNotification);
            mockPushNotificationService.sendToEmployee.mockRejectedValue(
                new Error('FCM service unavailable'),
            );

            // Act & Assert - should not throw
            await expect(
                listener.handleNotificationCreated({ notificationId }),
            ).resolves.not.toThrow();

            expect(mockPushNotificationService.sendToEmployee).toHaveBeenCalled();
        });

        it('should use default title for unknown notification types', async () => {
            // Arrange
            const notificationId = 4;
            const mockNotification: Partial<Notification> = {
                id: notificationId,
                type: 'UNKNOWN_TYPE' as NotificationType,
                message: 'Unknown notification',
                employeeId: 'employee-999',
                requestId: null,
                status: NotificationStatus.UNREAD,
                metadata: {},
                createdAt: new Date(),
            };

            mockNotificationRepository.findOne.mockResolvedValue(mockNotification);

            // Act
            await listener.handleNotificationCreated({ notificationId });

            // Assert
            expect(mockPushNotificationService.sendToEmployee).toHaveBeenCalledWith(
                'employee-999',
                expect.objectContaining({
                    notification: expect.objectContaining({
                        title: 'Nueva Notificación',
                    }),
                }),
            );
        });
    });
});
