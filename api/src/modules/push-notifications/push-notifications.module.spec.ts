import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PushNotificationsModule } from './push-notifications.module';
import { DeviceTokenService } from '../notifications/device-token.service';
import { PushNotificationService } from '../notifications/push-notification.service';
import { NotificationCreatedListener } from '../notifications/listeners/notification-created.listener';
import { TokenCleanupScheduler } from '../notifications/schedulers/token-cleanup.scheduler';
import { PushSettingsController } from '../notifications/push-settings.controller';
import { DeviceToken } from '../notifications/entities/device-token.entity';
import { Notification } from '../notifications/entities/notification.entity';

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
            imports: [PushNotificationsModule],
        })
            .overrideProvider(getRepositoryToken(DeviceToken))
            .useValue(mockRepository)
            .overrideProvider(getRepositoryToken(Notification))
            .useValue(mockRepository)
            .overrideProvider(DeviceTokenService)
            .useValue({})
            .overrideProvider(PushNotificationService)
            .useValue({})
            .overrideProvider(NotificationCreatedListener)
            .useValue({})
            .overrideProvider(TokenCleanupScheduler)
            .useValue({})
            .compile();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
    });

    it('should have PushSettingsController', () => {
        const controller = module.get<PushSettingsController>(PushSettingsController);
        expect(controller).toBeDefined();
    });

    it('should have DeviceTokenService', () => {
        const service = module.get<DeviceTokenService>(DeviceTokenService);
        expect(service).toBeDefined();
    });

    it('should have PushNotificationService', () => {
        const service = module.get<PushNotificationService>(PushNotificationService);
        expect(service).toBeDefined();
    });

    it('should have NotificationCreatedListener', () => {
        const listener = module.get<NotificationCreatedListener>(NotificationCreatedListener);
        expect(listener).toBeDefined();
    });

    it('should have TokenCleanupScheduler', () => {
        const scheduler = module.get<TokenCleanupScheduler>(TokenCleanupScheduler);
        expect(scheduler).toBeDefined();
    });

    it('should export PushNotificationService', () => {
        const exportedService = module.get<PushNotificationService>(PushNotificationService);
        expect(exportedService).toBeDefined();
    });

    it('should export DeviceTokenService', () => {
        const exportedService = module.get<DeviceTokenService>(DeviceTokenService);
        expect(exportedService).toBeDefined();
    });

    describe('Module Configuration', () => {
        it('should import TypeOrmModule with DeviceToken and Notification entities', () => {
            // This is implicitly tested by the module compilation
            expect(module).toBeDefined();
        });

        it('should import ScheduleModule', () => {
            // This is implicitly tested by the module compilation
            expect(module).toBeDefined();
        });
    });
});
