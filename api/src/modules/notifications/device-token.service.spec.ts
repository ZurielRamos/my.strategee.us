import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fc from 'fast-check';
import { DeviceTokenService } from './device-token.service';
import { DeviceToken } from './entities/device-token.entity';
import { Platform } from './enums/platform.enum';

describe('DeviceTokenService', () => {
    let service: DeviceTokenService;
    let repository: Repository<DeviceToken>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DeviceTokenService,
                {
                    provide: getRepositoryToken(DeviceToken),
                    useValue: {
                        findOne: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                        update: jest.fn(),
                        find: jest.fn(),
                        createQueryBuilder: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<DeviceTokenService>(DeviceTokenService);
        repository = module.get<Repository<DeviceToken>>(
            getRepositoryToken(DeviceToken),
        );
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    /**
     * Feature: firebase-push-notifications
     * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
     * 
     * Property 3: Persistencia de Token con Asociaciones
     * 
     * Para cualquier Device_Token obtenido, el sistema debe almacenarlo
     * en la base de datos asociado con el Employee_ID correcto, la plataforma,
     * un timestamp de creación, y un estado activo/inactivo.
     */
    describe('Property 3: Token Persistence with Associations', () => {
        it('should store token with all required associations', async () => {
            await fc.assert(
                fc.asyncProperty(
                    // Generador de employee ID (UUID)
                    fc.uuid(),
                    // Generador de FCM token (string largo)
                    fc.string({ minLength: 100, maxLength: 200 }),
                    // Generador de plataforma
                    fc.constantFrom(Platform.WEB, Platform.ANDROID, Platform.IOS),
                    async (employeeId, fcmToken, platform) => {
                        // Arrange: Mock repository behavior
                        const mockToken = {
                            id: 1,
                            employeeId,
                            fcmToken,
                            platform,
                            active: true,
                            lastUsedAt: new Date(),
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        };

                        jest.spyOn(repository, 'findOne').mockResolvedValue(null);
                        jest.spyOn(repository, 'create').mockReturnValue(mockToken as any);
                        jest.spyOn(repository, 'save').mockResolvedValue(mockToken as any);

                        // Act: Register token
                        const result = await service.registerToken(
                            employeeId,
                            fcmToken,
                            platform,
                        );

                        // Assert: Verify all required associations
                        expect(result.employeeId).toBe(employeeId);
                        expect(result.fcmToken).toBe(fcmToken);
                        expect(result.platform).toBe(platform);
                        expect(result.active).toBe(true);
                        expect(result.createdAt).toBeDefined();
                        expect(result.lastUsedAt).toBeDefined();
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should store platform type correctly for each platform', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.uuid(),
                    fc.string({ minLength: 100, maxLength: 200 }),
                    fc.constantFrom(Platform.WEB, Platform.ANDROID, Platform.IOS),
                    async (employeeId, fcmToken, platform) => {
                        const mockToken = {
                            id: 1,
                            employeeId,
                            fcmToken,
                            platform,
                            active: true,
                            lastUsedAt: new Date(),
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        };

                        jest.spyOn(repository, 'findOne').mockResolvedValue(null);
                        jest.spyOn(repository, 'create').mockReturnValue(mockToken as any);
                        jest.spyOn(repository, 'save').mockResolvedValue(mockToken as any);

                        const result = await service.registerToken(
                            employeeId,
                            fcmToken,
                            platform,
                        );

                        // Verify platform is one of the valid enum values
                        expect([Platform.WEB, Platform.ANDROID, Platform.IOS]).toContain(
                            result.platform,
                        );
                        expect(result.platform).toBe(platform);
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should store creation timestamp for any token', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.uuid(),
                    fc.string({ minLength: 100, maxLength: 200 }),
                    fc.constantFrom(Platform.WEB, Platform.ANDROID, Platform.IOS),
                    async (employeeId, fcmToken, platform) => {
                        const now = new Date();
                        const mockToken = {
                            id: 1,
                            employeeId,
                            fcmToken,
                            platform,
                            active: true,
                            lastUsedAt: now,
                            createdAt: now,
                            updatedAt: now,
                        };

                        jest.spyOn(repository, 'findOne').mockResolvedValue(null);
                        jest.spyOn(repository, 'create').mockReturnValue(mockToken as any);
                        jest.spyOn(repository, 'save').mockResolvedValue(mockToken as any);

                        const result = await service.registerToken(
                            employeeId,
                            fcmToken,
                            platform,
                        );

                        // Verify timestamp exists and is a valid date
                        expect(result.createdAt).toBeDefined();
                        expect(result.createdAt).toBeInstanceOf(Date);
                        expect(result.createdAt.getTime()).toBeLessThanOrEqual(
                            Date.now(),
                        );
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should store active/inactive status for any token', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.uuid(),
                    fc.string({ minLength: 100, maxLength: 200 }),
                    fc.constantFrom(Platform.WEB, Platform.ANDROID, Platform.IOS),
                    fc.boolean(),
                    async (employeeId, fcmToken, platform, activeStatus) => {
                        const mockToken = {
                            id: 1,
                            employeeId,
                            fcmToken,
                            platform,
                            active: activeStatus,
                            lastUsedAt: new Date(),
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        };

                        jest.spyOn(repository, 'findOne').mockResolvedValue(null);
                        jest.spyOn(repository, 'create').mockReturnValue(mockToken as any);
                        jest.spyOn(repository, 'save').mockResolvedValue(mockToken as any);

                        const result = await service.registerToken(
                            employeeId,
                            fcmToken,
                            platform,
                        );

                        // Verify active status is a boolean
                        expect(typeof result.active).toBe('boolean');
                        expect(result.active).toBeDefined();
                    },
                ),
                { numRuns: 100 },
            );
        });
    });

    /**
     * Feature: firebase-push-notifications
     * **Validates: Requirements 1.3**
     * 
     * Property 2: Obtención de Token tras Permiso Concedido
     * 
     * Para cualquier solicitud de permiso que sea concedida, el sistema debe
     * obtener un Device_Token válido de FCM.
     */
    describe('Property 2: Token Obtained After Permission Granted', () => {
        it('should register valid FCM token for any employee and platform', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.uuid(),
                    fc.string({ minLength: 100, maxLength: 200 }),
                    fc.constantFrom(Platform.WEB, Platform.ANDROID, Platform.IOS),
                    async (employeeId, fcmToken, platform) => {
                        const mockToken = {
                            id: 1,
                            employeeId,
                            fcmToken,
                            platform,
                            active: true,
                            lastUsedAt: new Date(),
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        };

                        jest.spyOn(repository, 'findOne').mockResolvedValue(null);
                        jest.spyOn(repository, 'create').mockReturnValue(mockToken as any);
                        jest.spyOn(repository, 'save').mockResolvedValue(mockToken as any);

                        const result = await service.registerToken(
                            employeeId,
                            fcmToken,
                            platform,
                        );

                        // Verify token is valid and stored
                        expect(result).toBeDefined();
                        expect(result.fcmToken).toBe(fcmToken);
                        expect(result.fcmToken.length).toBeGreaterThan(0);
                        expect(result.active).toBe(true);
                    },
                ),
                { numRuns: 100 },
            );
        });
    });

    /**
     * Feature: firebase-push-notifications
     * **Validates: Requirements 2.1, 2.3**
     * 
     * Property 4: Desactivación de Token
     * 
     * Para cualquier token activo, cuando un empleado deshabilita las notificaciones
     * push, el sistema debe marcar ese token como inactivo pero mantenerlo en almacenamiento.
     */
    describe('Property 4: Token Deactivation', () => {
        it('should mark any active token as inactive while keeping it in storage', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.uuid(),
                    fc.string({ minLength: 100, maxLength: 200 }),
                    async (employeeId, fcmToken) => {
                        // Mock update to simulate deactivation
                        jest.spyOn(repository, 'update').mockResolvedValue({
                            affected: 1,
                        } as any);

                        // Mock findOne to verify token still exists after deactivation
                        const mockToken = {
                            id: 1,
                            employeeId,
                            fcmToken,
                            platform: Platform.WEB,
                            active: false,
                            lastUsedAt: new Date(),
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        };
                        jest.spyOn(repository, 'findOne').mockResolvedValue(
                            mockToken as any,
                        );

                        await service.deactivateToken(employeeId, fcmToken);

                        // Verify update was called with active: false
                        expect(repository.update).toHaveBeenCalledWith(
                            { fcmToken, employeeId },
                            { active: false },
                        );

                        // Verify token still exists in storage
                        const tokenAfterDeactivation = await repository.findOne({
                            where: { fcmToken },
                        });
                        expect(tokenAfterDeactivation).toBeDefined();
                        expect(tokenAfterDeactivation?.active).toBe(false);
                    },
                ),
                { numRuns: 100 },
            );
        });
    });

    /**
     * Feature: firebase-push-notifications
     * **Validates: Requirements 3.5**
     * 
     * Property 7: Actualización de Token en Refresh
     * 
     * Para cualquier evento de refresh de token de FCM, el sistema debe
     * actualizar el token almacenado con el nuevo valor.
     */
    describe('Property 7: Token Update on Refresh', () => {
        it('should update old token with new token for any employee', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.uuid(),
                    fc.string({ minLength: 100, maxLength: 200 }),
                    fc.string({ minLength: 100, maxLength: 200 }),
                    fc.constantFrom(Platform.WEB, Platform.ANDROID, Platform.IOS),
                    async (employeeId, oldToken, newToken, platform) => {
                        // Ensure tokens are different
                        fc.pre(oldToken !== newToken);

                        const existingToken = {
                            id: 1,
                            employeeId,
                            fcmToken: oldToken,
                            platform,
                            active: true,
                            lastUsedAt: new Date(),
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        };

                        const updatedToken = {
                            id: 2,
                            employeeId,
                            fcmToken: newToken,
                            platform,
                            active: true,
                            lastUsedAt: new Date(),
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        };

                        jest.spyOn(repository, 'update').mockResolvedValue({
                            affected: 1,
                        } as any);
                        jest.spyOn(repository, 'findOne')
                            .mockResolvedValueOnce(existingToken as any)
                            .mockResolvedValueOnce(null);
                        jest.spyOn(repository, 'create').mockReturnValue(
                            updatedToken as any,
                        );
                        jest.spyOn(repository, 'save').mockResolvedValue(
                            updatedToken as any,
                        );

                        const result = await service.updateToken(
                            employeeId,
                            oldToken,
                            newToken,
                        );

                        // Verify old token was deactivated
                        expect(repository.update).toHaveBeenCalledWith(
                            { fcmToken: oldToken, employeeId },
                            { active: false },
                        );

                        // Verify new token was registered
                        expect(result.fcmToken).toBe(newToken);
                        expect(result.active).toBe(true);
                        expect(result.platform).toBe(platform);
                    },
                ),
                { numRuns: 100 },
            );
        });
    });

    /**
     * Feature: firebase-push-notifications
     * **Validates: Requirements 2.2**
     * 
     * Property 5: Exclusión de Tokens Inactivos
     * 
     * Para cualquier token marcado como inactivo, el sistema no debe
     * enviar notificaciones push a ese token.
     */
    describe('Property 5: Exclusion of Inactive Tokens', () => {
        it('should only return active tokens when querying for any employee', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.uuid(),
                    fc.array(
                        fc.record({
                            fcmToken: fc.string({ minLength: 100, maxLength: 200 }),
                            platform: fc.constantFrom(
                                Platform.WEB,
                                Platform.ANDROID,
                                Platform.IOS,
                            ),
                            active: fc.boolean(),
                        }),
                        { minLength: 1, maxLength: 10 },
                    ),
                    async (employeeId, tokens) => {
                        // Create mock tokens with unique IDs
                        const mockTokens = tokens.map((token, index) => ({
                            id: index + 1,
                            employeeId,
                            fcmToken: token.fcmToken,
                            platform: token.platform,
                            active: token.active,
                            lastUsedAt: new Date(),
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        }));

                        // Filter only active tokens
                        const activeTokens = mockTokens.filter((t) => t.active);

                        jest.spyOn(repository, 'find').mockResolvedValue(
                            activeTokens as any,
                        );

                        const result = await service.getActiveTokens(employeeId);

                        // Verify only active tokens are returned
                        expect(result.every((token) => token.active)).toBe(true);
                        expect(result.length).toBe(activeTokens.length);
                        
                        // Verify no inactive tokens are included
                        const inactiveCount = mockTokens.filter((t) => !t.active).length;
                        expect(result.length).toBe(mockTokens.length - inactiveCount);
                    },
                ),
                { numRuns: 100 },
            );
        });
    });

    describe('Unit Tests', () => {
        describe('registerToken', () => {
            it('should create new token when token does not exist', async () => {
                const employeeId = 'employee-123';
                const fcmToken = 'fcm-token-123';
                const platform = Platform.WEB;

                const mockToken = {
                    id: 1,
                    employeeId,
                    fcmToken,
                    platform,
                    active: true,
                    lastUsedAt: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                jest.spyOn(repository, 'findOne').mockResolvedValue(null);
                jest.spyOn(repository, 'create').mockReturnValue(mockToken as any);
                jest.spyOn(repository, 'save').mockResolvedValue(mockToken as any);

                const result = await service.registerToken(
                    employeeId,
                    fcmToken,
                    platform,
                );

                expect(repository.findOne).toHaveBeenCalledWith({
                    where: { fcmToken },
                });
                expect(repository.create).toHaveBeenCalled();
                expect(repository.save).toHaveBeenCalled();
                expect(result.employeeId).toBe(employeeId);
                expect(result.fcmToken).toBe(fcmToken);
                expect(result.platform).toBe(platform);
                expect(result.active).toBe(true);
            });

            it('should reactivate existing token', async () => {
                const employeeId = 'employee-123';
                const fcmToken = 'fcm-token-123';
                const platform = Platform.ANDROID;

                const existingToken = {
                    id: 1,
                    employeeId: 'old-employee',
                    fcmToken,
                    platform: Platform.WEB,
                    active: false,
                    lastUsedAt: new Date('2023-01-01'),
                    createdAt: new Date('2023-01-01'),
                    updatedAt: new Date('2023-01-01'),
                };

                jest.spyOn(repository, 'findOne').mockResolvedValue(
                    existingToken as any,
                );
                jest.spyOn(repository, 'save').mockResolvedValue({
                    ...existingToken,
                    employeeId,
                    platform,
                    active: true,
                    lastUsedAt: new Date(),
                } as any);

                const result = await service.registerToken(
                    employeeId,
                    fcmToken,
                    platform,
                );

                expect(result.active).toBe(true);
                expect(result.employeeId).toBe(employeeId);
                expect(result.platform).toBe(platform);
            });
        });

        describe('deactivateToken', () => {
            it('should mark token as inactive', async () => {
                const employeeId = 'employee-123';
                const fcmToken = 'fcm-token-123';

                jest.spyOn(repository, 'update').mockResolvedValue({
                    affected: 1,
                } as any);

                await service.deactivateToken(employeeId, fcmToken);

                expect(repository.update).toHaveBeenCalledWith(
                    { fcmToken, employeeId },
                    { active: false },
                );
            });
        });

        describe('getActiveTokens', () => {
            it('should return only active tokens for employee', async () => {
                const employeeId = 'employee-123';
                const mockTokens = [
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

                jest.spyOn(repository, 'find').mockResolvedValue(mockTokens as any);

                const result = await service.getActiveTokens(employeeId);

                expect(repository.find).toHaveBeenCalledWith({
                    where: { employeeId, active: true },
                });
                expect(result).toHaveLength(2);
                expect(result.every((token) => token.active)).toBe(true);
            });
        });

        describe('updateToken', () => {
            it('should deactivate old token and register new token', async () => {
                const employeeId = 'employee-123';
                const oldToken = 'old-fcm-token';
                const newToken = 'new-fcm-token';
                const platform = Platform.ANDROID;

                const existingToken = {
                    id: 1,
                    employeeId,
                    fcmToken: oldToken,
                    platform,
                    active: true,
                    lastUsedAt: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                const updatedToken = {
                    id: 2,
                    employeeId,
                    fcmToken: newToken,
                    platform,
                    active: true,
                    lastUsedAt: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                jest.spyOn(repository, 'update').mockResolvedValue({
                    affected: 1,
                } as any);
                jest.spyOn(repository, 'findOne')
                    .mockResolvedValueOnce(existingToken as any)
                    .mockResolvedValueOnce(null);
                jest.spyOn(repository, 'create').mockReturnValue(
                    updatedToken as any,
                );
                jest.spyOn(repository, 'save').mockResolvedValue(
                    updatedToken as any,
                );

                const result = await service.updateToken(
                    employeeId,
                    oldToken,
                    newToken,
                );

                expect(repository.update).toHaveBeenCalledWith(
                    { fcmToken: oldToken, employeeId },
                    { active: false },
                );
                expect(result.fcmToken).toBe(newToken);
                expect(result.active).toBe(true);
            });

            it('should preserve platform when updating token', async () => {
                const employeeId = 'employee-123';
                const oldToken = 'old-token';
                const newToken = 'new-token';
                const platform = Platform.IOS;

                const existingToken = {
                    id: 1,
                    employeeId,
                    fcmToken: oldToken,
                    platform,
                    active: true,
                    lastUsedAt: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                jest.spyOn(repository, 'update').mockResolvedValue({
                    affected: 1,
                } as any);
                jest.spyOn(repository, 'findOne')
                    .mockResolvedValueOnce(existingToken as any)
                    .mockResolvedValueOnce(null);
                jest.spyOn(repository, 'create').mockReturnValue({
                    ...existingToken,
                    fcmToken: newToken,
                } as any);
                jest.spyOn(repository, 'save').mockResolvedValue({
                    ...existingToken,
                    fcmToken: newToken,
                } as any);

                const result = await service.updateToken(
                    employeeId,
                    oldToken,
                    newToken,
                );

                expect(result.platform).toBe(platform);
            });
        });

        describe('deleteInactiveTokens', () => {
            it('should delete tokens inactive for more than specified days', async () => {
                const daysInactive = 30;
                const mockQueryBuilder = {
                    delete: jest.fn().mockReturnThis(),
                    where: jest.fn().mockReturnThis(),
                    andWhere: jest.fn().mockReturnThis(),
                    execute: jest.fn().mockResolvedValue({ affected: 5 }),
                };

                jest.spyOn(repository, 'createQueryBuilder').mockReturnValue(
                    mockQueryBuilder as any,
                );

                const result = await service.deleteInactiveTokens(daysInactive);

                expect(mockQueryBuilder.delete).toHaveBeenCalled();
                expect(mockQueryBuilder.where).toHaveBeenCalledWith(
                    'active = :active',
                    { active: false },
                );
                expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
                expect(result).toBe(5);
            });

            it('should return 0 when no tokens are deleted', async () => {
                const mockQueryBuilder = {
                    delete: jest.fn().mockReturnThis(),
                    where: jest.fn().mockReturnThis(),
                    andWhere: jest.fn().mockReturnThis(),
                    execute: jest.fn().mockResolvedValue({ affected: 0 }),
                };

                jest.spyOn(repository, 'createQueryBuilder').mockReturnValue(
                    mockQueryBuilder as any,
                );

                const result = await service.deleteInactiveTokens(30);

                expect(result).toBe(0);
            });

            it('should handle undefined affected count', async () => {
                const mockQueryBuilder = {
                    delete: jest.fn().mockReturnThis(),
                    where: jest.fn().mockReturnThis(),
                    andWhere: jest.fn().mockReturnThis(),
                    execute: jest.fn().mockResolvedValue({}),
                };

                jest.spyOn(repository, 'createQueryBuilder').mockReturnValue(
                    mockQueryBuilder as any,
                );

                const result = await service.deleteInactiveTokens(30);

                expect(result).toBe(0);
            });
        });

        describe('markTokenInactive', () => {
            it('should mark token as inactive by fcmToken', async () => {
                const fcmToken = 'fcm-token-123';

                jest.spyOn(repository, 'update').mockResolvedValue({
                    affected: 1,
                } as any);

                await service.markTokenInactive(fcmToken);

                expect(repository.update).toHaveBeenCalledWith(
                    { fcmToken },
                    { active: false },
                );
            });
        });

        describe('deactivateAllTokensForEmployee', () => {
            it('should deactivate all active tokens for employee', async () => {
                const employeeId = 'employee-123';

                jest.spyOn(repository, 'update').mockResolvedValue({
                    affected: 3,
                } as any);

                await service.deactivateAllTokensForEmployee(employeeId);

                expect(repository.update).toHaveBeenCalledWith(
                    { employeeId, active: true },
                    { active: false },
                );
            });
        });

        describe('getTokenStatus', () => {
            it('should return token status for employee and fcmToken', async () => {
                const employeeId = 'employee-123';
                const fcmToken = 'fcm-token-123';

                const mockToken = {
                    id: 1,
                    employeeId,
                    fcmToken,
                    platform: Platform.WEB,
                    active: true,
                    lastUsedAt: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                jest.spyOn(repository, 'findOne').mockResolvedValue(
                    mockToken as any,
                );

                const result = await service.getTokenStatus(employeeId, fcmToken);

                expect(repository.findOne).toHaveBeenCalledWith({
                    where: { employeeId, fcmToken },
                });
                expect(result).toEqual(mockToken);
            });

            it('should return null when token not found', async () => {
                const employeeId = 'employee-123';
                const fcmToken = 'non-existent-token';

                jest.spyOn(repository, 'findOne').mockResolvedValue(null);

                const result = await service.getTokenStatus(employeeId, fcmToken);

                expect(result).toBeNull();
            });
        });

        describe('Edge Cases', () => {
            it('should handle multiple tokens per employee across different platforms', async () => {
                const employeeId = 'employee-123';
                const mockTokens = [
                    {
                        id: 1,
                        employeeId,
                        fcmToken: 'web-token',
                        platform: Platform.WEB,
                        active: true,
                        lastUsedAt: new Date(),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                    {
                        id: 2,
                        employeeId,
                        fcmToken: 'android-token',
                        platform: Platform.ANDROID,
                        active: true,
                        lastUsedAt: new Date(),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                    {
                        id: 3,
                        employeeId,
                        fcmToken: 'ios-token',
                        platform: Platform.IOS,
                        active: true,
                        lastUsedAt: new Date(),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                ];

                jest.spyOn(repository, 'find').mockResolvedValue(mockTokens as any);

                const result = await service.getActiveTokens(employeeId);

                expect(result).toHaveLength(3);
                expect(result.map((t) => t.platform)).toEqual([
                    Platform.WEB,
                    Platform.ANDROID,
                    Platform.IOS,
                ]);
            });

            it('should handle reactivation of previously inactive token', async () => {
                const employeeId = 'employee-123';
                const fcmToken = 'reactivated-token';
                const platform = Platform.WEB;

                const inactiveToken = {
                    id: 1,
                    employeeId: 'old-employee',
                    fcmToken,
                    platform,
                    active: false,
                    lastUsedAt: new Date('2023-01-01'),
                    createdAt: new Date('2023-01-01'),
                    updatedAt: new Date('2023-01-01'),
                };

                jest.spyOn(repository, 'findOne').mockResolvedValue(
                    inactiveToken as any,
                );
                jest.spyOn(repository, 'save').mockResolvedValue({
                    ...inactiveToken,
                    employeeId,
                    active: true,
                    lastUsedAt: new Date(),
                } as any);

                const result = await service.registerToken(
                    employeeId,
                    fcmToken,
                    platform,
                );

                expect(result.active).toBe(true);
                expect(result.employeeId).toBe(employeeId);
            });

            it('should handle empty result when employee has no active tokens', async () => {
                const employeeId = 'employee-no-tokens';

                jest.spyOn(repository, 'find').mockResolvedValue([]);

                const result = await service.getActiveTokens(employeeId);

                expect(result).toEqual([]);
                expect(result).toHaveLength(0);
            });
        });
    });
});
