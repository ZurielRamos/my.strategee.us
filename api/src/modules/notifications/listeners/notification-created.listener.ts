import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PushNotificationService } from '../push-notification.service';
import { PushNotificationPayload } from '../interfaces';
import { Notification } from '../entities/notification.entity';
import { NotificationType } from '../enums/notification-type.enum';
import { Employee } from '@modules/core/employees/entities/employee.entity';
import { EmployeeSettings } from '@modules/core/employees/entities/employee-settings.entity';
import { MailService } from '@modules/infrastructure/mail/mail.service';

export interface NotificationCreatedEvent {
    notificationId: number;
}

@Injectable()
export class NotificationCreatedListener {
    private readonly logger = new Logger(NotificationCreatedListener.name);

    constructor(
        private pushNotificationService: PushNotificationService,
        private mailService: MailService,
        @InjectRepository(Notification)
        private notificationRepository: Repository<Notification>,
        @InjectRepository(Employee)
        private employeeRepository: Repository<Employee>,
        @InjectRepository(EmployeeSettings)
        private employeeSettingsRepository: Repository<EmployeeSettings>,
    ) {}

    @OnEvent('notification.created')
    async handleNotificationCreated(event: NotificationCreatedEvent): Promise<void> {
        try {
            const { notificationId } = event;

            const notification = await this.notificationRepository.findOne({
                where: { id: notificationId },
                relations: ['request'],
            });

            if (!notification) {
                this.logger.warn(`Notification ${notificationId} not found`);
                return;
            }

            // Push notification
            const payload: PushNotificationPayload = {
                notification: {
                    title: this.getNotificationTitle(notification),
                    body: notification.message,
                },
                data: {
                    notificationId: notification.id.toString(),
                    requestId: notification.requestId?.toString() || '',
                    type: notification.type,
                },
            };

            await this.pushNotificationService.sendToEmployee(notification.employeeId, payload);

            // Email notifications
            await this.sendEmailIfEnabled(notification);

        } catch (error) {
            this.logger.error(
                `Error handling notification.created event: ${error.message}`,
                error.stack,
            );
        }
    }

    private async sendEmailIfEnabled(notification: Notification): Promise<void> {
        const [employee, settings] = await Promise.all([
            this.employeeRepository.findOne({ where: { id: notification.employeeId } }),
            this.employeeSettingsRepository.findOne({ where: { employeeId: notification.employeeId } }),
        ]);

        if (!employee || !settings) return;

        const title = this.getNotificationTitle(notification);
        const fullName = `${employee.firstName} ${employee.lastName}`;
        const emails: string[] = [];

        if (settings.personalEmailNotification && employee.personalEmail) {
            emails.push(employee.personalEmail);
        }

        if (settings.corporativeEmailNotification && employee.corporateEmail) {
            emails.push(employee.corporateEmail);
        }

        await Promise.all(
            emails.map(email =>
                this.mailService
                    .sendNotification(email, fullName, title, notification.message, notification.metadata)
                    .catch(err =>
                        this.logger.error(`Error sending notification email to ${email}: ${err.message}`)
                    )
            )
        );
    }

    private getNotificationTitle(notification: Notification): string {
        switch (notification.type) {
            case NotificationType.REQUEST_STATUS_CHANGE:
                return 'Actualización de Solicitud';
            default:
                return 'Nueva Notificación';
        }
    }
}
