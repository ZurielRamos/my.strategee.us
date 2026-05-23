import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
    IonSplitPane, IonMenu, IonHeader, IonToolbar, IonTitle,
    IonContent, IonList, IonListHeader, IonNote, IonMenuToggle,
    IonItem, IonIcon, IonLabel, IonRouterOutlet, IonBadge, IonFooter
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    homeOutline, homeSharp,
    gridOutline, gridSharp,
    peopleOutline, peopleSharp,
    cubeOutline, cubeSharp,
    businessOutline, businessSharp,
    cashOutline, cashSharp,
    imagesOutline, imagesSharp,
    documentTextOutline, documentTextSharp,
    settingsOutline, settingsSharp,
    notificationsOutline, notificationsSharp,
    schoolOutline, schoolSharp
} from 'ionicons/icons';
import { UserProfileComponent } from '../../shared/components/user-profile/user-profile.component';
import { AdminRequestsService } from '../requests/services/admin-requests.service';
import { Subscription, interval } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';

@Component({
    selector: 'app-admin-layout',
    templateUrl: './admin-layout.component.html',
    styleUrls: ['./admin-layout.component.scss'],
    standalone: true,
    imports: [
        CommonModule, RouterLink, RouterLinkActive, IonSplitPane, IonMenu,
        IonContent, IonList, IonMenuToggle, IonItem, IonIcon, IonLabel, IonRouterOutlet, IonBadge, IonFooter,
        UserProfileComponent
    ]
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
    public appPages: Array<{
        title: string;
        url: string;
        icon: string;
        badge?: number;
    }> = [
        { title: 'Dashboard', url: '/admin/dashboard', icon: 'grid' },
        { title: 'Organización', url: '/admin/organization', icon: 'business' },
        { title: 'Personal', url: '/admin/employees', icon: 'people' },
        { title: 'Solicitudes', url: '/admin/requests', icon: 'document-text', badge: 0 },
        { title: 'Finanzas', url: '/admin/finance', icon: 'cash' },
        { title: 'Capacitaciones', url: '/admin/trainings', icon: 'school' },
        { title: 'Biblioteca', url: '/admin/media', icon: 'images' },
        { title: 'Configuraciones', url: '/admin/settings', icon: 'settings' }
    ];

    private pendingCountSubscription?: Subscription;

    constructor(private adminRequestsService: AdminRequestsService) {
        addIcons({
            homeOutline, homeSharp,
            gridOutline, gridSharp,
            peopleOutline, peopleSharp,
            cubeOutline, cubeSharp,
            businessOutline, businessSharp,
            cashOutline, cashSharp,
            imagesOutline, imagesSharp,
            documentTextOutline, documentTextSharp,
            settingsOutline, settingsSharp,
            notificationsOutline, notificationsSharp,
            schoolOutline, schoolSharp
        });
    }

    ngOnInit() {
        // Cargar el conteo de solicitudes pendientes cada 30 segundos
        this.pendingCountSubscription = interval(30000)
            .pipe(
                startWith(0),
                switchMap(() => this.adminRequestsService.getPendingCount())
            )
            .subscribe({
                next: (result) => {
                    const requestsPage = this.appPages.find(p => p.url === '/admin/requests');
                    if (requestsPage) {
                        requestsPage.badge = result.count;
                    }
                },
                error: (error) => {
                    console.error('Error loading pending requests count:', error);
                }
            });
    }

    ngOnDestroy() {
        if (this.pendingCountSubscription) {
            this.pendingCountSubscription.unsubscribe();
        }
    }
}
