import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { DeviceToken } from './entities/device-token.entity';
import { Request } from '@modules/operations/requests/entities/request.entity';
import { Employee } from '@modules/core/employees/entities/employee.entity';
import { EmployeeSettings } from '@modules/core/employees/entities/employee-settings.entity';
import { NotificationsService } from './notifications.service';
import { DeviceTokenService } from './device-token.service';
import { PushNotificationService } from './push-notification.service';
import { NotificationsController } from './notifications.controller';
import { PushSettingsController } from './push-settings.controller';
import { RequestStatusListener } from './listeners/request-status.listener';
import { NotificationCreatedListener } from './listeners/notification-created.listener';
import { NotificationsCleanupScheduler } from './schedulers/notifications-cleanup.scheduler';
import { TokenCleanupScheduler } from './schedulers/token-cleanup.scheduler';

@Module({
    imports: [
        TypeOrmModule.forFeature([Notification, DeviceToken, Request, Employee, EmployeeSettings]),
    ],
    providers: [
        NotificationsService,
        DeviceTokenService,
        PushNotificationService,
        RequestStatusListener,
        NotificationCreatedListener,
        NotificationsCleanupScheduler,
        TokenCleanupScheduler,
    ],
    controllers: [NotificationsController, PushSettingsController],
    exports: [NotificationsService, DeviceTokenService],
})
export class NotificationsModule {}
