import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceToken } from './entities/device-token.entity';
import { Notification } from './entities/notification.entity';
import { Employee } from '@modules/core/employees/entities/employee.entity';
import { EmployeeSettings } from '@modules/core/employees/entities/employee-settings.entity';
import { DeviceTokenService } from './device-token.service';
import { PushNotificationService } from './push-notification.service';
import { NotificationCreatedListener } from './listeners/notification-created.listener';
import { TokenCleanupScheduler } from './schedulers/token-cleanup.scheduler';
import { PushSettingsController } from './push-settings.controller';

/**
 * Module for Firebase Push Notifications integration
 * 
 * This module provides push notification functionality through Firebase Cloud Messaging (FCM).
 * It integrates with the existing notification system via event-driven architecture.
 * 
 * Features:
 * - Device token management (registration, update, deactivation)
 * - Push notification sending to multiple platforms (Web, Android, iOS)
 * - Event-driven integration with notification system
 * - Automatic cleanup of inactive tokens
 * 
 * @module PushNotificationsModule
 */
@Module({
    imports: [
        TypeOrmModule.forFeature([DeviceToken, Notification, Employee, EmployeeSettings]),
    ],
    controllers: [PushSettingsController],
    providers: [
        DeviceTokenService,
        PushNotificationService,
        NotificationCreatedListener,
        TokenCleanupScheduler,
    ],
    exports: [PushNotificationService, DeviceTokenService],
})
export class PushNotificationsModule {}
