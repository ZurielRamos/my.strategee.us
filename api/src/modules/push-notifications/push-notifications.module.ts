import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { DeviceToken } from '../notifications/entities/device-token.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { Employee } from '@modules/core/employees/entities/employee.entity';
import { EmployeeSettings } from '@modules/core/employees/entities/employee-settings.entity';
import { DeviceTokenService } from '../notifications/device-token.service';
import { PushNotificationService } from '../notifications/push-notification.service';
import { NotificationCreatedListener } from '../notifications/listeners/notification-created.listener';
import { TokenCleanupScheduler } from '../notifications/schedulers/token-cleanup.scheduler';
import { PushSettingsController } from '../notifications/push-settings.controller';

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
 * Imports:
 * - TypeOrmModule.forFeature([DeviceToken, Notification]): Database entities
 * - ScheduleModule.forRoot(): Scheduled tasks support
 * 
 * Controllers:
 * - PushSettingsController: REST API for push notification settings
 * 
 * Providers:
 * - DeviceTokenService: Manages device token lifecycle
 * - PushNotificationService: Sends push notifications via FCM
 * - NotificationCreatedListener: Listens to notification.created events
 * - TokenCleanupScheduler: Scheduled cleanup of inactive tokens
 * 
 * Exports:
 * - PushNotificationService: For use in other modules
 * - DeviceTokenService: For use in other modules
 * 
 * @module PushNotificationsModule
 */
@Module({
    imports: [
        TypeOrmModule.forFeature([DeviceToken, Notification, Employee, EmployeeSettings]),
        ScheduleModule.forRoot(),
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
