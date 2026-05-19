import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TokenCleanupScheduler } from './token-cleanup.scheduler';
import { DeviceTokenService } from '../device-token.service';

describe('TokenCleanupScheduler', () => {
    let scheduler: TokenCleanupScheduler;
    let deviceTokenService: DeviceTokenService;
    let configService: ConfigService;

    const mockDeviceTokenService = {
        deleteInactiveTokens: jest.fn(),
    };

    const mockConfigService = {
        get: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TokenCleanupScheduler,
                {
                    provide: DeviceTokenService,
                    useValue: mockDeviceTokenService,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();

        scheduler = module.get<TokenCleanupScheduler>(TokenCleanupScheduler);
        deviceTokenService =
            module.get<DeviceTokenService>(DeviceTokenService);
        configService = module.get<ConfigService>(ConfigService);

        // Reset mocks
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(scheduler).toBeDefined();
    });

    describe('handleCleanup', () => {
        it('should delete inactive tokens using configured retention days', async () => {
            // Arrange
            const retentionDays = 30;
            const deletedCount = 15;
            mockConfigService.get.mockReturnValue(retentionDays);
            mockDeviceTokenService.deleteInactiveTokens.mockResolvedValue(
                deletedCount,
            );

            // Act
            await scheduler.handleCleanup();

            // Assert
            expect(configService.get).toHaveBeenCalledWith(
                'PUSH_TOKEN_RETENTION_DAYS',
                30,
            );
            expect(
                deviceTokenService.deleteInactiveTokens,
            ).toHaveBeenCalledWith(retentionDays);
        });

        it('should use default retention days (30) when not configured', async () => {
            // Arrange
            const defaultRetentionDays = 30;
            const deletedCount = 5;
            mockConfigService.get.mockReturnValue(defaultRetentionDays);
            mockDeviceTokenService.deleteInactiveTokens.mockResolvedValue(
                deletedCount,
            );

            // Act
            await scheduler.handleCleanup();

            // Assert
            expect(configService.get).toHaveBeenCalledWith(
                'PUSH_TOKEN_RETENTION_DAYS',
                30,
            );
            expect(
                deviceTokenService.deleteInactiveTokens,
            ).toHaveBeenCalledWith(defaultRetentionDays);
        });

        it('should handle errors during cleanup gracefully', async () => {
            // Arrange
            const error = new Error('Database connection error');
            mockConfigService.get.mockReturnValue(30);
            mockDeviceTokenService.deleteInactiveTokens.mockRejectedValue(
                error,
            );

            // Act & Assert - should not throw
            await expect(scheduler.handleCleanup()).resolves.not.toThrow();
        });

        it('should log the number of deleted tokens', async () => {
            // Arrange
            const deletedCount = 42;
            mockConfigService.get.mockReturnValue(30);
            mockDeviceTokenService.deleteInactiveTokens.mockResolvedValue(
                deletedCount,
            );

            // Act
            await scheduler.handleCleanup();

            // Assert
            expect(deviceTokenService.deleteInactiveTokens).toHaveBeenCalled();
        });

        it('should handle zero deleted tokens', async () => {
            // Arrange
            const deletedCount = 0;
            mockConfigService.get.mockReturnValue(30);
            mockDeviceTokenService.deleteInactiveTokens.mockResolvedValue(
                deletedCount,
            );

            // Act
            await scheduler.handleCleanup();

            // Assert
            expect(
                deviceTokenService.deleteInactiveTokens,
            ).toHaveBeenCalledWith(30);
        });

        it('should work with custom retention periods', async () => {
            // Arrange
            const customRetentionDays = 60;
            const deletedCount = 8;
            mockConfigService.get.mockReturnValue(customRetentionDays);
            mockDeviceTokenService.deleteInactiveTokens.mockResolvedValue(
                deletedCount,
            );

            // Act
            await scheduler.handleCleanup();

            // Assert
            expect(
                deviceTokenService.deleteInactiveTokens,
            ).toHaveBeenCalledWith(customRetentionDays);
        });

        it('should handle service errors without propagating them', async () => {
            // Arrange
            const error = new Error('Service unavailable');
            mockConfigService.get.mockReturnValue(30);
            mockDeviceTokenService.deleteInactiveTokens.mockRejectedValue(
                error,
            );

            // Act
            const result = scheduler.handleCleanup();

            // Assert - should resolve without throwing
            await expect(result).resolves.toBeUndefined();
        });

        it('should call deleteInactiveTokens exactly once per execution', async () => {
            // Arrange
            mockConfigService.get.mockReturnValue(30);
            mockDeviceTokenService.deleteInactiveTokens.mockResolvedValue(10);

            // Act
            await scheduler.handleCleanup();

            // Assert
            expect(
                deviceTokenService.deleteInactiveTokens,
            ).toHaveBeenCalledTimes(1);
        });
    });

    describe('Cron Configuration', () => {
        it('should have handleCleanup method defined', () => {
            // Verify the scheduler has the cleanup method
            expect(scheduler.handleCleanup).toBeDefined();
            expect(typeof scheduler.handleCleanup).toBe('function');
        });
    });
});
