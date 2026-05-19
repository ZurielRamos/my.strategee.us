import { Component, Input, OnInit, OnDestroy, inject, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import {
    IonHeader, IonToolbar, IonButtons, IonMenuButton, IonIcon
} from '@ionic/angular/standalone';
import { PopoverController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { searchOutline, notificationsOutline, closeOutline, arrowBackOutline } from 'ionicons/icons';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { UserProfileComponent } from "../user-profile/user-profile.component";
import { NotificationsPopoverComponent } from '../notifications-popover/notifications-popover.component';
import { NotificationBadgeComponent } from '../notification-badge/notification-badge.component';

@Component({
    selector: 'app-page-header',
    templateUrl: './page-header.component.html',
    styleUrls: ['./page-header.component.scss'],
    standalone: true,
    imports: [
        CommonModule, FormsModule, IonHeader, IonToolbar,
        IonButtons, IonMenuButton, IonIcon,
        UserProfileComponent, NotificationBadgeComponent
    ]
})
export class PageHeaderComponent implements OnInit, OnDestroy {
    @Input() pageTitle: string = '';
    @Input() showSearch: boolean = false;
    @Input() backUrl?: string;
    @Input() useCustomSearch: boolean = false;
    @Input() notificationCount: number = 0;
    @Output() searchChange = new EventEmitter<string>();

    searchQuery: string = '';
    isMobileSearchActive: boolean = false;

    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private popoverCtrl = inject(PopoverController);
    private queryParamsSub?: Subscription;

    @ViewChild('mobileSearchInput') mobileSearchInput?: ElementRef<HTMLInputElement>;

    constructor() {
        addIcons({ searchOutline, notificationsOutline, closeOutline, arrowBackOutline });
    }

    onBack() {
        if (this.backUrl) {
            this.router.navigate([this.backUrl]);
        }
    }

    async openNotifications(event: Event) {
            const popover = await this.popoverCtrl.create({
                component: NotificationsPopoverComponent,
                event: event,
                alignment: 'end',
                size: 'auto',
                dismissOnSelect: false,
                cssClass: 'notifications-popover'
            });

            await popover.present();
        }

    ngOnInit() {
        if (!this.useCustomSearch) {
            this.queryParamsSub = this.route.queryParams.subscribe(params => {
                this.searchQuery = params['search'] || '';
            });
        }
    }

    ngOnDestroy() {
        this.queryParamsSub?.unsubscribe();
    }

    onSearchSubmit(event: any) {
        const value = event.target.value;
        if (this.useCustomSearch) {
            this.searchQuery = value;
            this.searchChange.emit(value);
        } else {
            this.updateSearchQuery(value);
        }
    }

    clearSearch() {
        this.searchQuery = '';
        if (this.useCustomSearch) {
            this.searchChange.emit('');
        } else {
            this.updateSearchQuery('');
        }
    }

    toggleMobileSearch() {
        this.isMobileSearchActive = !this.isMobileSearchActive;
        if (!this.isMobileSearchActive) {
            // Opcional: limpiar la busqueda al cerrar si lo prefieres,
            // pero usualmente al cerrar el buscador móvil no se limpia el query si ya se buscó.
            // this.clearSearch();
        } else {
            setTimeout(() => {
                this.mobileSearchInput?.nativeElement.focus();
            }, 300); // Dar más tiempo para que termine la animación
        }
    }

    private updateSearchQuery(query: string) {
        const queryParams: any = { ...this.route.snapshot.queryParams };
        if (query) {
            queryParams['search'] = query;
        } else {
            delete queryParams['search'];
        }
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: queryParams,
            queryParamsHandling: 'merge',
            replaceUrl: true
        });
    }
}
