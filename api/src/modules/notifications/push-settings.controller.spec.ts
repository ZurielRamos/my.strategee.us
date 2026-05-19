import { Test, TestingModule } from '@nestjs/testing';
import { PushSettingsController } from './push-settings.controller';
import { DeviceTokenService } from './device-token.service';
import { PushNotificationService } from './push-notification.service';
import { Platform } from './enums/platform.enum';
import {
    RegisterTokenDto,
    UpdateTokenDto,
    DeactivateTokenDto,
    SendTestNotificationDto,
} from './dto';

describe('PushSettingsController', () => {
    let controller: PushSettingsController;
    let deviceTokenService: DeviceTokenService;
    let pushNotificationService: PushNotificationService;

    const mockEmployeeId = 'employee-123';

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [PushSettingsController],
            providers: [
                {
                    provide: DeviceTokenService,
                    useValue: {
                        registerToken: jest.fn(),
                        updateToken: jest.fn(),
                        deactivateToken: jest.fn(),
                        getTokenStatus: jest.fn(),
                        deactivateAllTokensForEmployee: jest.fn(),
                    },
                },
                {
                    provide: PushNotificationService,
                    useValue: {
                        sendTestNotification: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<PushSettingsController>(PushSettingsController);
        deviceTokenService = module.get<DeviceTokenService>(DeviceTokenService);
        pushNotificationService = module.get<PushNotificationService>(
            PushNotificationService,
        );
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('registerToken', () => {
        it('should call deviceTokenService.registerToken with correct parameters', async () => {
            const dto: RegisterTokenDto = {
                fcmToken: 'test-token-123',
                platform: Platform.WEB,
            };

            await controller.registerToken(mockEmployeeId, dto);

            expect(deviceTokenService.registerToken).toHaveBeenCalledWith(
                mockEmployeeId,
                dto.fcmToken,
                dto.platform,
            );
        });

        it('should handle different platforms', async () => {
            const platforms = [Platform.WEB, Platform.ANDROID, Platform.IOS];

            for (const platform of platforms) {
                const dto: RegisterTokenDto = {
                    fcmToken: `token-${platform}`,
                    platform,
                };

                await controller.registerToken(mockEmployeeId, dto);

                expect(deviceTokenService.registerToken).toHaveBeenCalledWith(
                    mockEmployeeId,
                    dto.fcmToken,
                    platform,
                );
            }
        });
    });

    describe('updateToken', () => {
        it('should call deviceTokenService.updateToken with correct parameters', async () => {
            const dto: UpdateTokenDto = {
                oldToken: 'old-token-123',
                newToken: 'new-token-456',
            };

            await controller.updateToken(mockEmployeeId, dto);

            expect(deviceTokenService.updateToken).toHaveBeenCalledWith(
                mockEmployeeId,
                dto.oldToken,
                dto.newToken,
            );
        });
    });

    describe('deactivateToken', () => {
        it('should call deviceTokenService.deactivateToken with correct parameters', async () => {
            const dto: DeactivateTokenDto = {
                fcmToken: 'token-to-deactivate',
            };

            await controller.deactivateToken(mockEmployeeId, dto);

            expect(deviceTokenService.deactivateToken).toHaveBeenCalledWith(
                mockEmployeeId,
                dto.fcmToken,
            );
        });
    });

    describe('getStatus', () => {
        it('should return enabled status when token is active', async () => {
            const fcmToken = 'active-token';
            const mockToken = {
                id: 1,
                employeeId: mockEmployeeId,
                fcmToken,
                platform: Platform.WEB,
                active: true,
                lastUsedAt: new Date('2024-01-15T10:00:00Z'),
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            jest.spyOn(deviceTokenService, 'getTokenStatus').mockResolvedValue(
                mockToken,
            );

            const result = await controller.getStatus(mockEmployeeId, fcmToken);

            expect(result).toEqual({
                enabled: true,
                platform: Platform.WEB,
                lastNotificationAt: mockToken.lastUsedAt,
                permissionStatus: 'granted',
            });
        });

        it('should return disabled status when token does not exist', async () => {
            const fcmToken = 'non-existent-token';

            jest.spyOn(deviceTokenService, 'getTokenStatus').mockResolvedValue(
                null,
            );

            const result = await controller.getStatus(mockEmployeeId, fcmToken);

            expect(result).toEqual({
                enabled: false,
                platform: Platform.WEB,
                lastNotificationAt: undefined,
                permissionStatus: 'default',
            });
        });

        it('should return disabled status when token is inactive', async () => {
            const fcmToken = 'inactive-token';
            const mockToken = {
                id: 1,
                employeeId: mockEmployeeId,
                fcmToken,
                platform: Platform.ANDROID,
                active: false,
                lastUsedAt: new Date('2024-01-10T10:00:00Z'),
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            jest.spyOn(deviceTokenService, 'getTokenStatus').mockResolvedValue(
                mockToken,
            );

            const result = await controller.getStatus(mockEmployeeId, fcmToken);

            expect(result).toEqual({
                enabled: false,
                platform: Platform.ANDROID,
                lastNotificationAt: mockToken.lastUsedAt,
                permissionStatus: 'default',
            });
        });
    });

    describe('sendTestNotification', () => {
        it('should call pushNotificationService.sendTestNotification with correct parameters', async () => {
            const dto: SendTestNotificationDto = {
                fcmToken: 'test-token',
            };

            await controller.sendTestNotification(mockEmployeeId, dto);

            expect(
                pushNotificationService.sendTestNotification,
            ).toHaveBeenCalledWith(mockEmployeeId, dto.fcmToken);
        });
    });

    describe('logout', () => {
        it('should call deviceTokenService.deactivateAllTokensForEmployee with correct employeeId', async () => {
            await controller.logout(mockEmployeeId);

            expect(
                deviceTokenService.deactivateAllTokensForEmployee,
            ).toHaveBeenCalledWith(mockEmployeeId);
        });
    });

    describe('DTO validation', () => {
        it('should validate RegisterTokenDto requires fcmToken', () => {
            const dto = new RegisterTokenDto();
            expect(dto.fcmToken).toBeUndefined();
            expect(dto.platform).toBeUndefined();
        });

        it('should validate UpdateTokenDto requires both tokens', () => {
            const dto = new UpdateTokenDto();
            expect(dto.oldToken).toBeUndefined();
            expect(dto.newToken).toBeUndefined();
        });

        it('should validate DeactivateTokenDto requires fcmToken', () => {
            const dto = new DeactivateTokenDto();
            expect(dto.fcmToken).toBeUndefined();
        });

        it('should validate SendTestNotificationDto requires fcmToken', () => {
            const dto = new SendTestNotificationDto();
            expect(dto.fcmToken).toBeUndefined();
        });
    });
});
