import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as fc from 'fast-check';
import { TokenCleanupScheduler } from './token-cleanup.scheduler';
import { DeviceTokenService } from '../device-token.service';

describe('TokenCleanupScheduler - Property-Based Tests', () => {
    let scheduler: TokenCleanupScheduler;
    let deviceTokenService: DeviceTokenService;
    let configService: ConfigService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TokenCleanupScheduler,
                {
                    provide: DeviceTokenService,
                    useValue: {
                        deleteInactiveTokens: jest.fn(),
                    },
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn(),
                    },
                },
            ],
        }).compile();

        scheduler = module.get<TokenCleanupScheduler>(TokenCleanupScheduler);
        deviceTokenService = module.get<DeviceTokenService>(DeviceTokenService);
        configService = module.get<ConfigService>(ConfigService);

        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    /**
     * Feature: firebase-push-notifications
     * **Validates: Requirements 8.2**
     *
     * Property 16: Limpieza de Tokens Antiguos
     *
     * Para cualquier token marcado como inactivo por más de 30 días,
     * el sistema debe eliminarlo automáticamente de la base de datos.
     */
    describe('Property 16: Cleanup of Old Tokens', () => {
        it('should delete inactive tokens older than configured retention days for any configuration', async () => {
            await fc.assert(
                fc.asyncProperty(
                    // Generador de días de retención (entre 1 y 365 días)
                    fc.integer({ min: 1, max: 365 }),
                    // Generador de cantidad de tokens eliminados
                    fc.integer({ min: 0, max: 1000 }),
                    async (retentionDays, deletedCount) => {
                        // Arrange: Mock configuration and service
                        jest.spyOn(configService, 'get').mockReturnValue(
                            retentionDays,
                        );
                        jest.spyOn(
                            deviceTokenService,
                            'deleteInactiveTokens',
                        ).mockResolvedValue(deletedCount);

                        // Act: Execute cleanup
                        await scheduler.handleCleanup();

                        // Assert: Verify deleteInactiveTokens was called with correct retention days
                        expect(configService.get).toHaveBeenCalledWith(
                            'PUSH_TOKEN_RETENTION_DAYS',
                            30,
                        );
                        expect(
                            deviceTokenService.deleteInactiveTokens,
                        ).toHaveBeenCalledWith(retentionDays);
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should use default retention of 30 days when configuration is not provided', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.integer({ min: 0, max: 1000 }),
                    async (deletedCount) => {
                        // Arrange: Mock configuration to return default value
                        jest.spyOn(configService, 'get').mockImplementation(
                            (key: string, defaultValue?: any) => defaultValue,
                        );
                        jest.spyOn(
                            deviceTokenService,
                            'deleteInactiveTokens',
                        ).mockResolvedValue(deletedCount);

                        // Act: Execute cleanup
                        await scheduler.handleCleanup();

                        // Assert: Verify default value of 30 days is used
                        expect(
                            deviceTokenService.deleteInactiveTokens,
                        ).toHaveBeenCalledWith(30);
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should handle any number of deleted tokens correctly', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.integer({ min: 1, max: 365 }),
                    fc.integer({ min: 0, max: 10000 }),
                    async (retentionDays, deletedCount) => {
                        // Clear mocks for each iteration
                        jest.clearAllMocks();

                        // Arrange
                        jest.spyOn(configService, 'get').mockReturnValue(
                            retentionDays,
                        );
                        jest.spyOn(
                            deviceTokenService,
                            'deleteInactiveTokens',
                        ).mockResolvedValue(deletedCount);

                        // Act
                        await scheduler.handleCleanup();

                        // Assert: Verify the service was called and completed successfully
                        expect(
                            deviceTokenService.deleteInactiveTokens,
                        ).toHaveBeenCalledTimes(1);
                        expect(
                            deviceTokenService.deleteInactiveTokens,
                        ).toHaveBeenCalledWith(retentionDays);
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should execute cleanup for any valid retention period', async () => {
            await fc.assert(
                fc.asyncProperty(
                    // Test with various retention periods including edge cases
                    fc.oneof(
                        fc.constant(1), // Minimum: 1 day
                        fc.constant(7), // 1 week
                        fc.constant(30), // Default: 30 days
                        fc.constant(90), // 3 months
                        fc.constant(365), // 1 year
                        fc.integer({ min: 1, max: 365 }), // Any valid value
                    ),
                    async (retentionDays) => {
                        // Arrange
                        jest.spyOn(configService, 'get').mockReturnValue(
                            retentionDays,
                        );
                        jest.spyOn(
                            deviceTokenService,
                            'deleteInactiveTokens',
                        ).mockResolvedValue(5);

                        // Act
                        await scheduler.handleCleanup();

                        // Assert: Verify cleanup was executed with the retention period
                        expect(
                            deviceTokenService.deleteInactiveTokens,
                        ).toHaveBeenCalledWith(retentionDays);
                        expect(retentionDays).toBeGreaterThanOrEqual(1);
                        expect(retentionDays).toBeLessThanOrEqual(365);
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should not throw errors for any valid input combination', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.integer({ min: 1, max: 365 }),
                    fc.integer({ min: 0, max: 10000 }),
                    async (retentionDays, deletedCount) => {
                        // Arrange
                        jest.spyOn(configService, 'get').mockReturnValue(
                            retentionDays,
                        );
                        jest.spyOn(
                            deviceTokenService,
                            'deleteInactiveTokens',
                        ).mockResolvedValue(deletedCount);

                        // Act & Assert: Should not throw
                        await expect(
                            scheduler.handleCleanup(),
                        ).resolves.not.toThrow();
                    },
                ),
                { numRuns: 100 },
            );
        });
    });
});
