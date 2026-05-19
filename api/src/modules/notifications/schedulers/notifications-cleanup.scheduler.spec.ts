import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotificationsCleanupScheduler } from './notifications-cleanup.scheduler';
import { NotificationsService } from '../notifications.service';

describe('NotificationsCleanupScheduler', () => {
    let scheduler: NotificationsCleanupScheduler;
    let notificationsService: NotificationsService;
    let configService: ConfigService;

    const mockNotificationsService = {
        deleteOldNotifications: jest.fn(),
    };

    const mockConfigService = {
        get: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationsCleanupScheduler,
                {
                    provide: NotificationsService,
                    useValue: mockNotificationsService,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();

        scheduler = module.get<NotificationsCleanupScheduler>(NotificationsCleanupScheduler);
        notificationsService = module.get<NotificationsService>(NotificationsService);
        configService = module.get<ConfigService>(ConfigService);

        // Reset mocks
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(scheduler).toBeDefined();
    });

    describe('handleCleanup', () => {
        it('should delete old notifications using configured retention days', async () => {
            // Arrange
            const retentionDays = 90;
            const deletedCount = 42;
            mockConfigService.get.mockReturnValue(retentionDays);
            mockNotificationsService.deleteOldNotifications.mockResolvedValue(deletedCount);

            // Act
            await scheduler.handleCleanup();

            // Assert
            expect(configService.get).toHaveBeenCalledWith('NOTIFICATIONS_RETENTION_DAYS', 90);
            expect(notificationsService.deleteOldNotifications).toHaveBeenCalledWith(retentionDays);
        });

        it('should use default retention days when not configured', async () => {
            // Arrange
            const defaultRetentionDays = 90;
            const deletedCount = 10;
            mockConfigService.get.mockReturnValue(defaultRetentionDays);
            mockNotificationsService.deleteOldNotifications.mockResolvedValue(deletedCount);

            // Act
            await scheduler.handleCleanup();

            // Assert
            expect(configService.get).toHaveBeenCalledWith('NOTIFICATIONS_RETENTION_DAYS', 90);
            expect(notificationsService.deleteOldNotifications).toHaveBeenCalledWith(defaultRetentionDays);
        });

        it('should handle errors gracefully', async () => {
            // Arrange
            const error = new Error('Database error');
            mockConfigService.get.mockReturnValue(90);
            mockNotificationsService.deleteOldNotifications.mockRejectedValue(error);

            // Act & Assert - should not throw
            await expect(scheduler.handleCleanup()).resolves.not.toThrow();
        });

        it('should log the number of deleted notifications', async () => {
            // Arrange
            const deletedCount = 25;
            mockConfigService.get.mockReturnValue(90);
            mockNotificationsService.deleteOldNotifications.mockResolvedValue(deletedCount);

            // Act
            await scheduler.handleCleanup();

            // Assert
            expect(notificationsService.deleteOldNotifications).toHaveBeenCalled();
        });
    });
});
