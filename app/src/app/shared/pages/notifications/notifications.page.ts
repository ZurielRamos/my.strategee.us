import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { NotificationListComponent } from '../../components/notification-list/notification-list.component';

@Component({
    selector: 'app-notifications',
    templateUrl: './notifications.page.html',
    styleUrls: ['./notifications.page.scss'],
    standalone: true,
    imports: [
        CommonModule, IonContent, PageHeaderComponent, NotificationListComponent
    ]
})
export class NotificationsPage {
}
