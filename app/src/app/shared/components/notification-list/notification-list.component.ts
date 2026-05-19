import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
    IonContent, IonList, IonItem, IonLabel, IonIcon, IonSpinner,
    IonInfiniteScroll, IonInfiniteScrollContent, IonButton
} from '@ionic/angular/standalone';
import { InfiniteScrollCustomEvent } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
    notificationsOffOutline, checkmarkCircleOutline, alertCircleOutline,
    informationCircleOutline, documentTextOutline
} from 'ionicons/icons';
import { NotificationService } from '../../services/notification.service';
import { Notification, NotificationStatus } from '../../models/notification.model';

@Component({
    selector: 'app-notification-list',
    templateUrl: './notification-list.component.html',
    styleUrls: ['./notification-list.component.scss'],
    standalone: true,
    imports: [
        CommonModule, IonContent, IonList, IonItem, IonLabel, IonIcon,
        IonSpinner, IonInfiniteScroll, IonInfiniteScrollContent, IonButton
    ]
})
export class NotificationListComponent implements OnInit {
    private notificationService = inject(NotificationService);
    private router = inject(Router);

    notifications: Notification[] = [];
    loading = false;
    currentPage = 1;
    totalPages = 1;
    limit = 20;

    constructor() {
        addIcons({
            notificationsOffOutline, checkmarkCircleOutline, alertCircleOutline,
            informationCircleOutline, documentTextOutline
        });
    }

    ngOnInit() {
        this.loadNotifications();
    }

    async loadNotifications(event?: InfiniteScrollCustomEvent) {
        if (this.loading) return;

        this.loading = true;

        try {
            const result = await this.notificationService.getNotifications({
                page: this.currentPage,
                limit: this.limit
            }).toPromise();

            if (result) {
                this.notifications = [...this.notifications, ...result.data];
                this.totalPages = result.totalPages;
                this.currentPage++;
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            this.loading = false;
            if (event) {
                event.target.complete();
            }
        }
    }

    async markAsRead(notification: Notification) {
        if (notification.status === NotificationStatus.READ) return;

        try {
            await this.notificationService.markAsRead([notification.id]).toPromise();
            notification.status = NotificationStatus.READ;
            notification.readAt = new Date();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    async markAllAsRead() {
        const unreadIds = this.notifications
            .filter(n => n.status === NotificationStatus.UNREAD)
            .map(n => n.id);

        if (unreadIds.length === 0) return;

        try {
            await this.notificationService.markAsRead(unreadIds).toPromise();
            this.notifications.forEach(n => {
                if (n.status === NotificationStatus.UNREAD) {
                    n.status = NotificationStatus.READ;
                    n.readAt = new Date();
                }
            });
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    }

    navigateToRequest(notification: Notification) {
        if (notification.requestId) {
            this.markAsRead(notification);
            this.router.navigate(['/employee/requests', notification.requestId]);
        }
    }

    onIonInfinite(event: InfiniteScrollCustomEvent) {
        if (this.currentPage <= this.totalPages) {
            this.loadNotifications(event);
        } else {
            event.target.complete();
        }
    }

    getNotificationIcon(type: string): string {
        switch (type) {
            case 'REQUEST_STATUS_CHANGE':
                return 'document-text-outline';
            default:
                return 'information-circle-outline';
        }
    }

    formatTime(date: Date): string {
        const now = new Date();
        const notificationDate = new Date(date);
        const diff = now.getTime() - notificationDate.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) {
            return 'Ahora';
        } else if (minutes < 60) {
            return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
        } else if (hours < 24) {
            return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
        } else {
            return `Hace ${days} día${days > 1 ? 's' : ''}`;
        }
    }

    get hasUnreadNotifications(): boolean {
        return this.notifications.some(n => n.status === NotificationStatus.UNREAD);
    }
}
