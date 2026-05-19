import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { Request } from '@modules/operations/requests/entities/request.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationType } from './enums/notification-type.enum';
import { NotificationStatus } from './enums/notification-status.enum';
import { GetNotificationsQueryDto } from './dto/get-notifications-query.dto';

describe('NotificationsService', () => {
    let service: NotificationsService;
    let notificationsRepository: Repository<Notification>;
    let requestsRepository: Repository<Request>;
    let eventEmitter: EventEmitter2;

    const mockNotificationsRepository = {
        create: jest.fn(),
        save: jest.fn(),
        createQueryBuilder: jest.fn(),
        count: jest.fn(),
        find: jest.fn(),
    };

    const mockRequestsRepository = {};

    const mockEventEmitter = {
        emit: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationsService,
                {
                    provide: getRepositoryToken(Notification),
                    useValue: mockNotificationsRepository,
                },
                {
                    provide: getRepositoryToken(Request),
                    useValue: mockRequestsRepository,
                },
                {
                    provide: EventEmitter2,
                    useValue: mockEventEmitter,
                },
            ],
        }).compile();

        service = module.get<NotificationsService>(NotificationsService);
        notificationsRepository = module.get<Repository<Notification>>(
            getRepositoryToken(Notification),
        );
        requestsRepository = module.get<Repository<Request>>(
            getRepositoryToken(Request),
        );
        eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createNotification', () => {
        it('should create and save a notification', async () => {
            const dto: CreateNotificationDto = {
                type: NotificationType.REQUEST_STATUS_CHANGE,
                message: 'Tu solicitud ha sido aprobada',
                metadata: {
                    requestType: 'VACATION',
                    previousStatus: 'PENDING',
                    newStatus: 'APPROVED',
                },
                employeeId: 'employee-123',
                requestId: 1,
            };

            const mockNotification = {
                id: 1,
                ...dto,
                createdAt: new Date(),
            };

            mockNotificationsRepository.create.mockReturnValue(mockNotification);
            mockNotificationsRepository.save.mockResolvedValue(mockNotification);

            const result = await service.createNotification(dto);

            expect(notificationsRepository.create).toHaveBeenCalledWith({
                type: dto.type,
                message: dto.message,
                metadata: dto.metadata,
                employeeId: dto.employeeId,
                requestId: dto.requestId,
            });
            expect(notificationsRepository.save).toHaveBeenCalledWith(mockNotification);
            expect(result).toEqual(mockNotification);
        });

        it('should create notification without requestId', async () => {
            const dto: CreateNotificationDto = {
                type: NotificationType.REQUEST_STATUS_CHANGE,
                message: 'Notificación general',
                metadata: {},
                employeeId: 'employee-456',
            };

            const mockNotification = {
                id: 2,
                ...dto,
                createdAt: new Date(),
            };

            mockNotificationsRepository.create.mockReturnValue(mockNotification);
            mockNotificationsRepository.save.mockResolvedValue(mockNotification);

            const result = await service.createNotification(dto);

            expect(notificationsRepository.create).toHaveBeenCalledWith({
                type: dto.type,
                message: dto.message,
                metadata: dto.metadata,
                employeeId: dto.employeeId,
                requestId: undefined,
            });
            expect(result).toEqual(mockNotification);
        });
    });

    describe('findAllForEmployee', () => {
        let mockQueryBuilder: any;

        beforeEach(() => {
            mockQueryBuilder = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                getManyAndCount: jest.fn(),
            };

            mockNotificationsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        });

        it('should return paginated notifications for an employee', async () => {
            const employeeId = 'employee-123';
            const query: GetNotificationsQueryDto = {
                page: 1,
                limit: 10,
            };

            const mockNotifications = [
                {
                    id: 1,
                    type: NotificationType.REQUEST_STATUS_CHANGE,
                    message: 'Notificación 1',
                    metadata: {},
                    status: NotificationStatus.UNREAD,
                    employeeId,
                    requestId: 1,
                    readAt: null,
                    createdAt: new Date('2024-01-02'),
                },
                {
                    id: 2,
                    type: NotificationType.REQUEST_STATUS_CHANGE,
                    message: 'Notificación 2',
                    metadata: {},
                    status: NotificationStatus.READ,
                    employeeId,
                    requestId: 2,
                    readAt: new Date('2024-01-01'),
                    createdAt: new Date('2024-01-01'),
                },
            ];

            mockQueryBuilder.getManyAndCount.mockResolvedValue([mockNotifications, 2]);

            const result = await service.findAllForEmployee(employeeId, query);

            expect(mockNotificationsRepository.createQueryBuilder).toHaveBeenCalledWith('notification');
            expect(mockQueryBuilder.where).toHaveBeenCalledWith(
                'notification.employeeId = :employeeId',
                { employeeId }
            );
            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('notification.createdAt', 'DESC');
            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
            expect(result.data).toHaveLength(2);
            expect(result.meta).toEqual({
                page: 1,
                limit: 10,
                total: 2,
                totalPages: 1,
            });
        });

        it('should filter notifications by status when provided', async () => {
            const employeeId = 'employee-123';
            const query: GetNotificationsQueryDto = {
                page: 1,
                limit: 10,
                status: NotificationStatus.UNREAD,
            };

            const mockNotifications = [
                {
                    id: 1,
                    type: NotificationType.REQUEST_STATUS_CHANGE,
                    message: 'Notificación no leída',
                    metadata: {},
                    status: NotificationStatus.UNREAD,
                    employeeId,
                    requestId: 1,
                    readAt: null,
                    createdAt: new Date('2024-01-02'),
                },
            ];

            mockQueryBuilder.getManyAndCount.mockResolvedValue([mockNotifications, 1]);

            const result = await service.findAllForEmployee(employeeId, query);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                'notification.status = :status',
                { status: NotificationStatus.UNREAD }
            );
            expect(result.data).toHaveLength(1);
            expect(result.data[0].status).toBe(NotificationStatus.UNREAD);
        });

        it('should return notifications ordered by createdAt descending', async () => {
            const employeeId = 'employee-123';
            const query: GetNotificationsQueryDto = {
                page: 1,
                limit: 10,
            };

            const mockNotifications = [
                {
                    id: 2,
                    type: NotificationType.REQUEST_STATUS_CHANGE,
                    message: 'Notificación más reciente',
                    metadata: {},
                    status: NotificationStatus.UNREAD,
                    employeeId,
                    requestId: 2,
                    readAt: null,
                    createdAt: new Date('2024-01-02'),
                },
                {
                    id: 1,
                    type: NotificationType.REQUEST_STATUS_CHANGE,
                    message: 'Notificación más antigua',
                    metadata: {},
                    status: NotificationStatus.READ,
                    employeeId,
                    requestId: 1,
                    readAt: new Date('2024-01-01'),
                    createdAt: new Date('2024-01-01'),
                },
            ];

            mockQueryBuilder.getManyAndCount.mockResolvedValue([mockNotifications, 2]);

            const result = await service.findAllForEmployee(employeeId, query);

            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('notification.createdAt', 'DESC');
            expect(result.data[0].createdAt).toEqual(new Date('2024-01-02'));
            expect(result.data[1].createdAt).toEqual(new Date('2024-01-01'));
        });

        it('should apply pagination correctly', async () => {
            const employeeId = 'employee-123';
            const query: GetNotificationsQueryDto = {
                page: 2,
                limit: 5,
            };

            const mockNotifications = [
                {
                    id: 6,
                    type: NotificationType.REQUEST_STATUS_CHANGE,
                    message: 'Notificación 6',
                    metadata: {},
                    status: NotificationStatus.UNREAD,
                    employeeId,
                    requestId: 6,
                    readAt: null,
                    createdAt: new Date('2024-01-06'),
                },
            ];

            mockQueryBuilder.getManyAndCount.mockResolvedValue([mockNotifications, 11]);

            const result = await service.findAllForEmployee(employeeId, query);

            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(5); // (page 2 - 1) * limit 5
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
            expect(result.meta).toEqual({
                page: 2,
                limit: 5,
                total: 11,
                totalPages: 3,
            });
        });

        it('should return only notifications for the specified employee', async () => {
            const employeeId = 'employee-123';
            const query: GetNotificationsQueryDto = {
                page: 1,
                limit: 10,
            };

            const mockNotifications = [
                {
                    id: 1,
                    type: NotificationType.REQUEST_STATUS_CHANGE,
                    message: 'Notificación para employee-123',
                    metadata: {},
                    status: NotificationStatus.UNREAD,
                    employeeId: 'employee-123',
                    requestId: 1,
                    readAt: null,
                    createdAt: new Date('2024-01-01'),
                },
            ];

            mockQueryBuilder.getManyAndCount.mockResolvedValue([mockNotifications, 1]);

            const result = await service.findAllForEmployee(employeeId, query);

            expect(mockQueryBuilder.where).toHaveBeenCalledWith(
                'notification.employeeId = :employeeId',
                { employeeId: 'employee-123' }
            );
            expect(result.data).toHaveLength(1);
        });

        it('should return empty array when employee has no notifications', async () => {
            const employeeId = 'employee-no-notifications';
            const query: GetNotificationsQueryDto = {
                page: 1,
                limit: 10,
            };

            mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

            const result = await service.findAllForEmployee(employeeId, query);

            expect(result.data).toEqual([]);
            expect(result.meta).toEqual({
                page: 1,
                limit: 10,
                total: 0,
                totalPages: 0,
            });
        });
    });

    describe('getUnreadCount', () => {
        it('should return the count of unread notifications for an employee', async () => {
            const employeeId = 'employee-123';
            const expectedCount = 5;

            mockNotificationsRepository.count.mockResolvedValue(expectedCount);

            const result = await service.getUnreadCount(employeeId);

            expect(notificationsRepository.count).toHaveBeenCalledWith({
                where: {
                    employeeId,
                    status: NotificationStatus.UNREAD,
                },
            });
            expect(result).toBe(expectedCount);
        });

        it('should return zero when employee has no unread notifications', async () => {
            const employeeId = 'employee-no-unread';

            mockNotificationsRepository.count.mockResolvedValue(0);

            const result = await service.getUnreadCount(employeeId);

            expect(notificationsRepository.count).toHaveBeenCalledWith({
                where: {
                    employeeId,
                    status: NotificationStatus.UNREAD,
                },
            });
            expect(result).toBe(0);
        });

        it('should only count UNREAD notifications, not READ ones', async () => {
            const employeeId = 'employee-456';
            const expectedCount = 3;

            mockNotificationsRepository.count.mockResolvedValue(expectedCount);

            const result = await service.getUnreadCount(employeeId);

            expect(notificationsRepository.count).toHaveBeenCalledWith({
                where: {
                    employeeId,
                    status: NotificationStatus.UNREAD,
                },
            });
            expect(result).toBe(expectedCount);
        });
    });

    describe('markAsRead', () => {
        it('should mark unread notifications as read', async () => {
            const employeeId = 'employee-123';
            const notificationIds = [1, 2];
            const now = new Date();

            const mockNotifications = [
                {
                    id: 1,
                    type: NotificationType.REQUEST_STATUS_CHANGE,
                    message: 'Notificación 1',
                    metadata: {},
                    status: NotificationStatus.UNREAD,
                    employeeId,
                    requestId: 1,
                    readAt: null,
                    createdAt: new Date(),
                },
                {
                    id: 2,
                    type: NotificationType.REQUEST_STATUS_CHANGE,
                    message: 'Notificación 2',
                    metadata: {},
                    status: NotificationStatus.UNREAD,
                    employeeId,
                    requestId: 2,
                    readAt: null,
                    createdAt: new Date(),
                },
            ];

            mockNotificationsRepository.find.mockResolvedValue(mockNotifications);
            mockNotificationsRepository.save.mockResolvedValue(mockNotifications);

            await service.markAsRead(employeeId, notificationIds);

            expect(notificationsRepository.find).toHaveBeenCalledWith({
                where: {
                    id: expect.anything(),
                },
            });
            expect(notificationsRepository.save).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        id: 1,
                        status: NotificationStatus.READ,
                        readAt: expect.any(Date),
                    }),
                    expect.objectContaining({
                        id: 2,
                        status: NotificationStatus.READ,
                        readAt: expect.any(Date),
                    }),
                ])
            );
        });

        it('should preserve readAt if notification is already marked as read', async () => {
            const employeeId = 'employee-123';
            const notificationIds = [1, 2];
            const originalReadAt = new Date('2024-01-01');

            const mockNotifications = [
                {
                    id: 1,
                    type: NotificationType.REQUEST_STATUS_CHANGE,
                    message: 'Notificación 1',
                    metadata: {},
                    status: NotificationStatus.UNREAD,
                    employeeId,
                    requestId: 1,
                    readAt: null,
                    createdAt: new Date(),
                },
                {
                    id: 2,
                    type: NotificationType.REQUEST_STATUS_CHANGE,
                    message: 'Notificación 2',
                    metadata: {},
                    status: NotificationStatus.READ,
                    employeeId,
                    requestId: 2,
                    readAt: originalReadAt,
                    createdAt: new Date(),
                },
            ];

            mockNotificationsRepository.find.mockResolvedValue(mockNotifications);
            mockNotificationsRepository.save.mockResolvedValue([mockNotifications[0]]);

            await service.markAsRead(employeeId, notificationIds);

            // Solo debe actualizar la notificación 1 (UNREAD)
            expect(notificationsRepository.save).toHaveBeenCalledWith([
                expect.objectContaining({
                    id: 1,
                    status: NotificationStatus.READ,
                    readAt: expect.any(Date),
                }),
            ]);
        });

        it('should throw ForbiddenException if notification does not belong to employee', async () => {
            const employeeId = 'employee-123';
            const notificationIds = [1, 2];

            const mockNotifications = [
                {
                    id: 1,
                    type: NotificationType.REQUEST_STATUS_CHANGE,
                    message: 'Notificación 1',
                    metadata: {},
                    status: NotificationStatus.UNREAD,
                    employeeId: 'employee-123',
                    requestId: 1,
                    readAt: null,
                    createdAt: new Date(),
                },
                {
                    id: 2,
                    type: NotificationType.REQUEST_STATUS_CHANGE,
                    message: 'Notificación 2',
                    metadata: {},
                    status: NotificationStatus.UNREAD,
                    employeeId: 'employee-456', // Diferente empleado
                    requestId: 2,
                    readAt: null,
                    createdAt: new Date(),
                },
            ];

            mockNotificationsRepository.find.mockResolvedValue(mockNotifications);

            await expect(service.markAsRead(employeeId, notificationIds)).rejects.toThrow(
                'No tienes permiso para marcar estas notificaciones como leídas'
            );
            expect(notificationsRepository.save).not.toHaveBeenCalled();
        });

        it('should throw NotFoundException if notification does not exist', async () => {
            const employeeId = 'employee-123';
            const notificationIds = [1, 2, 3];

            const mockNotifications = [
                {
                    id: 1,
                    type: NotificationType.REQUEST_STATUS_CHANGE,
                    message: 'Notificación 1',
                    metadata: {},
                    status: NotificationStatus.UNREAD,
                    employeeId,
                    requestId: 1,
                    readAt: null,
                    createdAt: new Date(),
                },
            ];

            mockNotificationsRepository.find.mockResolvedValue(mockNotifications);

            await expect(service.markAsRead(employeeId, notificationIds)).rejects.toThrow(
                'Una o más notificaciones no fueron encontradas'
            );
            expect(notificationsRepository.save).not.toHaveBeenCalled();
        });

        it('should handle empty notification IDs array', async () => {
            const employeeId = 'employee-123';
            const notificationIds: number[] = [];

            await service.markAsRead(employeeId, notificationIds);

            expect(notificationsRepository.find).not.toHaveBeenCalled();
            expect(notificationsRepository.save).not.toHaveBeenCalled();
        });

        it('should support batch operations for multiple notifications', async () => {
            const employeeId = 'employee-123';
            const notificationIds = [1, 2, 3, 4, 5];

            const mockNotifications = notificationIds.map(id => ({
                id,
                type: NotificationType.REQUEST_STATUS_CHANGE,
                message: `Notificación ${id}`,
                metadata: {},
                status: NotificationStatus.UNREAD,
                employeeId,
                requestId: id,
                readAt: null,
                createdAt: new Date(),
            }));

            mockNotificationsRepository.find.mockResolvedValue(mockNotifications);
            mockNotificationsRepository.save.mockResolvedValue(mockNotifications);

            await service.markAsRead(employeeId, notificationIds);

            expect(notificationsRepository.save).toHaveBeenCalledWith(
                expect.arrayContaining(
                    notificationIds.map(id =>
                        expect.objectContaining({
                            id,
                            status: NotificationStatus.READ,
                            readAt: expect.any(Date),
                        })
                    )
                )
            );
        });

        it('should not update notifications if all are already read', async () => {
            const employeeId = 'employee-123';
            const notificationIds = [1, 2];
            const originalReadAt = new Date('2024-01-01');

            const mockNotifications = [
                {
                    id: 1,
                    type: NotificationType.REQUEST_STATUS_CHANGE,
                    message: 'Notificación 1',
                    metadata: {},
                    status: NotificationStatus.READ,
                    employeeId,
                    requestId: 1,
                    readAt: originalReadAt,
                    createdAt: new Date(),
                },
                {
                    id: 2,
                    type: NotificationType.REQUEST_STATUS_CHANGE,
                    message: 'Notificación 2',
                    metadata: {},
                    status: NotificationStatus.READ,
                    employeeId,
                    requestId: 2,
                    readAt: originalReadAt,
                    createdAt: new Date(),
                },
            ];

            mockNotificationsRepository.find.mockResolvedValue(mockNotifications);

            await service.markAsRead(employeeId, notificationIds);

            expect(notificationsRepository.save).not.toHaveBeenCalled();
        });
    });

    describe('deleteOldNotifications', () => {
        it('should delete notifications older than specified days', async () => {
            const daysToKeep = 90;
            const deletedCount = 15;

            const mockQueryBuilder = {
                delete: jest.fn().mockReturnThis(),
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue({ affected: deletedCount }),
            };

            mockNotificationsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

            const result = await service.deleteOldNotifications(daysToKeep);

            expect(mockNotificationsRepository.createQueryBuilder).toHaveBeenCalled();
            expect(mockQueryBuilder.delete).toHaveBeenCalled();
            expect(mockQueryBuilder.from).toHaveBeenCalledWith(Notification);
            expect(mockQueryBuilder.where).toHaveBeenCalledWith(
                'createdAt < :cutoffDate',
                expect.objectContaining({
                    cutoffDate: expect.any(Date),
                })
            );
            expect(mockQueryBuilder.execute).toHaveBeenCalled();
            expect(result).toBe(deletedCount);
        });

        it('should calculate cutoff date correctly', async () => {
            const daysToKeep = 90;
            const now = new Date();
            const expectedCutoffDate = new Date();
            expectedCutoffDate.setDate(now.getDate() - daysToKeep);

            const mockQueryBuilder = {
                delete: jest.fn().mockReturnThis(),
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue({ affected: 5 }),
            };

            mockNotificationsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

            await service.deleteOldNotifications(daysToKeep);

            const whereCall = mockQueryBuilder.where.mock.calls[0];
            const cutoffDate = whereCall[1].cutoffDate;

            // Verificar que la fecha límite está dentro de un rango razonable (1 segundo de diferencia)
            const timeDiff = Math.abs(cutoffDate.getTime() - expectedCutoffDate.getTime());
            expect(timeDiff).toBeLessThan(1000);
        });

        it('should return zero when no notifications are deleted', async () => {
            const daysToKeep = 90;

            const mockQueryBuilder = {
                delete: jest.fn().mockReturnThis(),
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue({ affected: 0 }),
            };

            mockNotificationsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

            const result = await service.deleteOldNotifications(daysToKeep);

            expect(result).toBe(0);
        });

        it('should return zero when affected is undefined', async () => {
            const daysToKeep = 90;

            const mockQueryBuilder = {
                delete: jest.fn().mockReturnThis(),
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue({}),
            };

            mockNotificationsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

            const result = await service.deleteOldNotifications(daysToKeep);

            expect(result).toBe(0);
        });

        it('should handle different retention periods', async () => {
            const testCases = [30, 60, 90, 180];

            for (const daysToKeep of testCases) {
                const mockQueryBuilder = {
                    delete: jest.fn().mockReturnThis(),
                    from: jest.fn().mockReturnThis(),
                    where: jest.fn().mockReturnThis(),
                    execute: jest.fn().mockResolvedValue({ affected: 10 }),
                };

                mockNotificationsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

                await service.deleteOldNotifications(daysToKeep);

                const whereCall = mockQueryBuilder.where.mock.calls[0];
                const cutoffDate = whereCall[1].cutoffDate;

                const expectedCutoffDate = new Date();
                expectedCutoffDate.setDate(expectedCutoffDate.getDate() - daysToKeep);

                const timeDiff = Math.abs(cutoffDate.getTime() - expectedCutoffDate.getTime());
                expect(timeDiff).toBeLessThan(1000);
            }
        });

        it('should delete large number of notifications', async () => {
            const daysToKeep = 90;
            const deletedCount = 1000;

            const mockQueryBuilder = {
                delete: jest.fn().mockReturnThis(),
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue({ affected: deletedCount }),
            };

            mockNotificationsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

            const result = await service.deleteOldNotifications(daysToKeep);

            expect(result).toBe(deletedCount);
        });
    });
});
