import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonBadge } from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../services/notification.service';

@Component({
    selector: 'app-notification-badge',
    template: `
        @if (count > 0) {
            <ion-badge color="danger">
                {{ count > 99 ? '99+' : count }}
            </ion-badge>
        }
    `,
    styles: [`
        ion-badge {
            position: absolute;
            top: -4px;
            right: -4px;
            font-size: 10px;
            font-weight: 700;
            min-width: 18px;
            height: 18px;
            border-radius: 9px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 5px;
        }
    `],
    standalone: true,
    imports: [CommonModule, IonBadge]
})
export class NotificationBadgeComponent implements OnInit, OnDestroy {
    private notificationService = inject(NotificationService);
    private subscription?: Subscription;

    count = 0;

    ngOnInit() {
        // Start polling to keep the BehaviorSubject updated
        this.subscription = this.notificationService
            .startPolling(30000)
            .subscribe();

        // React immediately to any count change (including when popover clears it)
        this.subscription.add(
            this.notificationService.unreadCount.subscribe(count => {
                this.count = count;
            })
        );
    }

    ngOnDestroy() {
        // Clean up subscription to prevent memory leaks
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }
}
