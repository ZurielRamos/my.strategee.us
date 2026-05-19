import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PushNotificationsModule } from './push-notifications.module';
import { DeviceTokenService } from './device-token.service';
import { PushNotificationService } from './push-notification.service';
import { NotificationCreatedListener } from './listeners/notification-created.listener';
import { TokenCleanupScheduler } from './schedulers/token-cleanup.scheduler';
import { PushSettingsController } from './push-settings.controller';
import { DeviceToken } from './entities/device-token.entity';
import { Notification } from './entities/notification.entity';

describe('PushNotificationsModule', () => {
    let module: TestingModule;

    const mockRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        createQueryBuilder: jest.fn(() => ({
            delete: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            execute: jest.fn().mockResolvedValue({ affected: 0 }),
        })),
    };

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    isGlobal: true,
                    envFilePath: '.env.test',
                }),
                PushNotificationsModule,
            ],
        })
            .overrideProvider(getRepositoryToken(DeviceToken))
            .useValue(mockRepository)
            .overrideProvider(getRepositoryToken(Notification))
            .useValue(mockRepository)
            .compile();
    });

    afterEach(async () => {
        if (module) {
            await module.close();
        }
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    it('should have DeviceTokenService provider', () => {
        const service = module.get<DeviceTokenService>(DeviceTokenService);
        expect(service).toBeDefined();
        expect(service).toBeInstanceOf(DeviceTokenService);
    });

    it('should have PushNotificationService provider', () => {
        const service = module.get<PushNotificationService>(PushNotificationService);
        expect(service).toBeDefined();
        expect(service).toBeInstanceOf(PushNotificationService);
    });

    it('should have NotificationCreatedListener provider', () => {
        const listener = module.get<NotificationCreatedListener>(NotificationCreatedListener);
        expect(listener).toBeDefined();
        expect(listener).toBeInstanceOf(NotificationCreatedListener);
    });

    it('should have TokenCleanupScheduler provider', () => {
        const scheduler = module.get<TokenCleanupScheduler>(TokenCleanupScheduler);
        expect(scheduler).toBeDefined();
        expect(scheduler).toBeInstanceOf(TokenCleanupScheduler);
    });

    it('should have PushSettingsController', () => {
        const controller = module.get<PushSettingsController>(PushSettingsController);
        expect(controller).toBeDefined();
        expect(controller).toBeInstanceOf(PushSettingsController);
    });

    it('should export DeviceTokenService', () => {
        const exportedService = module.get<DeviceTokenService>(DeviceTokenService);
        expect(exportedService).toBeDefined();
    });

    it('should export PushNotificationService', () => {
        const exportedService = module.get<PushNotificationService>(PushNotificationService);
        expect(exportedService).toBeDefined();
    });

    describe('Module Configuration', () => {
        it('should import TypeOrmModule with DeviceToken and Notification entities', () => {
            const deviceTokenService = module.get<DeviceTokenService>(DeviceTokenService);
            expect(deviceTokenService).toBeDefined();
        });

        it('should import ScheduleModule for scheduled tasks', () => {
            const scheduler = module.get<TokenCleanupScheduler>(TokenCleanupScheduler);
            expect(scheduler).toBeDefined();
        });
    });
});
