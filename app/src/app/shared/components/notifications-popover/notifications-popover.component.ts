import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent, IonFooter, IonSpinner } from '@ionic/angular/standalone';
import { PopoverController, NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { closeOutline, notificationsOffOutline, checkmarkCircleOutline, alertCircleOutline, informationCircleOutline } from 'ionicons/icons';
import { NotificationService } from '../../services/notification.service';
import { Notification, NotificationStatus } from '../../models/notification.model';

@Component({
    selector: 'app-notifications-popover',
    templateUrl: './notifications-popover.component.html',
    styleUrls: ['./notifications-popover.component.scss'],
    standalone: true,
    imports: [
        CommonModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
        IonIcon, IonContent, IonFooter, IonSpinner
    ]
})
export class NotificationsPopoverComponent implements OnInit {
    private popoverCtrl = inject(PopoverController);
    private notificationService = inject(NotificationService);
    private navCtrl = inject(NavController);

    notifications: Notification[] = [];
    loading = false;

    constructor() {
        addIcons({ closeOutline, notificationsOffOutline, checkmarkCircleOutline, alertCircleOutline, informationCircleOutline });
    }

    ngOnInit() {
        this.loadNotifications();
    }

    loadNotifications() {
        this.loading = true;
        this.notificationService.getNotifications({ limit: 10 }).subscribe({
            next: (result) => {
                this.notifications = result.data;
                this.loading = false;
                this.notificationService.clearUnreadCount();
            },
            error: (error) => {
                console.error('Error loading notifications:', error);
                this.loading = false;
            }
        });
    }

    close() {
        this.popoverCtrl.dismiss();
    }

    markAsRead(notification: Notification) {
        if (notification.status === NotificationStatus.READ) {
            return;
        }

        this.notificationService.markAsRead([notification.id]).subscribe({
            next: () => {
                notification.status = NotificationStatus.READ;
                notification.readAt = new Date();
            },
            error: (error) => {
                console.error('Error marking notification as read:', error);
            }
        });
    }

    navigateToRequest(notification: Notification) {
        if (notification.requestId) {
            this.markAsRead(notification);
            this.close();
            this.navCtrl.navigateForward(`/requests/${notification.requestId}`);
        }
    }

    getNotificationIcon(type: string): string {
        // Por ahora solo tenemos REQUEST_STATUS_CHANGE
        return 'checkmark-circle-outline';
    }

    isUnread(notification: Notification): boolean {
        return notification.status === NotificationStatus.UNREAD;
    }

    formatTime(date: Date | string): string {
            const now = new Date();
            const notificationDate = typeof date === 'string' ? new Date(date) : date;
            const diff = now.getTime() - notificationDate.getTime();

            // Si la diferencia es negativa, la fecha está en el futuro (problema de zona horaria)
            if (diff < 0) {
                return 'Justo ahora';
            }

            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);

            if (minutes < 1) {
                return 'Justo ahora';
            } else if (minutes < 60) {
                return `Hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
            } else if (hours < 24) {
                return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
            } else {
                return `Hace ${days} ${days === 1 ? 'día' : 'días'}`;
            }
        }

    markAllAsRead() {
        const unreadIds = this.notifications
            .filter(n => n.status === NotificationStatus.UNREAD)
            .map(n => n.id);

        if (unreadIds.length === 0) {
            return;
        }

        this.notificationService.markAsRead(unreadIds).subscribe({
            next: () => {
                this.notifications.forEach(n => {
                    if (unreadIds.includes(n.id)) {
                        n.status = NotificationStatus.READ;
                        n.readAt = new Date();
                    }
                });
            },
            error: (error) => {
                console.error('Error marking all as read:', error);
            }
        });
    }

    get hasUnreadNotifications(): boolean {
        return this.notifications.some(n => n.status === NotificationStatus.UNREAD);
    }
}
