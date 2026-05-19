import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    IonContent,
    IonButton,
    IonIcon,
    IonSpinner,
    IonFab,
    IonFabButton
} from '@ionic/angular/standalone';
import { ModalController, AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addOutline, createOutline, trashOutline, eyeOutline, locationOutline } from 'ionicons/icons';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LocationCardComponent } from './components/location-card/location-card.component';
import { LocationsService } from './services/locations.service';
import { Location } from './models/location.model';
import { LocationModalComponent } from './components/location-modal/location-modal.component';

@Component({
    selector: 'app-locations',
    templateUrl: './locations.page.html',
    styleUrls: ['./locations.page.scss'],
    standalone: true,
    providers: [ModalController, AlertController],
    imports: [
        CommonModule,
        FormsModule,
        IonContent,
        IonButton,
        IonIcon,
        IonSpinner,
        IonFab,
        IonFabButton,
        PageHeaderComponent,
        LocationCardComponent
    ]
})
export class LocationsPage implements OnInit {
    locations: Location[] = [];
    filteredLocations: Location[] = [];
    isLoading = false;
    searchTerm = '';

    constructor(
        private locationsService: LocationsService,
        private modalCtrl: ModalController,
        private alertCtrl: AlertController
    ) {
        addIcons({ addOutline, createOutline, trashOutline, eyeOutline, locationOutline });
    }

    ngOnInit() {
        this.loadLocations();
    }

    loadLocations() {
        this.isLoading = true;
        this.locationsService.getAll().subscribe({
            next: (data) => {
                this.locations = data;
                this.filterLocations();
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading locations:', error);
                this.isLoading = false;
            }
        });
    }

    onSearchChange(searchValue: string) {
        this.searchTerm = searchValue;
        this.filterLocations();
    }

    filterLocations() {
        if (!this.searchTerm.trim()) {
            this.filteredLocations = [...this.locations];
        } else {
            const term = this.searchTerm.toLowerCase().trim();
            this.filteredLocations = this.locations.filter(location =>
                location.name.toLowerCase().includes(term) ||
                location.description?.toLowerCase().includes(term)
            );
        }
    }

    async openCreateModal() {
        const modal = await this.modalCtrl.create({
            component: LocationModalComponent,
            componentProps: {
                mode: 'create'
            },
            cssClass: 'location-modal',
            backdropDismiss: true
        });

        await modal.present();

        const { data, role } = await modal.onWillDismiss();
        if (role === 'save' && data) {
            this.loadLocations();
        }
    }

    async openEditModal(location: Location) {
        const modal = await this.modalCtrl.create({
            component: LocationModalComponent,
            componentProps: {
                location,
                mode: 'edit'
            },
            cssClass: 'location-modal',
            backdropDismiss: true
        });

        await modal.present();

        const { data, role } = await modal.onWillDismiss();
        if (role === 'save' && data) {
            this.loadLocations();
        }
    }

    async openViewModal(location: Location) {
        const modal = await this.modalCtrl.create({
            component: LocationModalComponent,
            componentProps: {
                location,
                mode: 'view'
            },
            cssClass: 'location-modal',
            backdropDismiss: true
        });

        await modal.present();

        const { data, role } = await modal.onWillDismiss();
        if (role === 'edit' && data) {
            this.openEditModal(data);
        } else if (role === 'delete' && data) {
            this.confirmDelete(data);
        } else if (role === 'toggleActive' && data) {
            this.toggleActive(data);
        }
    }

    toggleActive(location: Location) {
        this.locationsService.toggleActive(location.id).subscribe({
            next: () => {
                this.loadLocations();
            },
            error: (error) => {
                console.error('Error toggling location status:', error);
            }
        });
    }

    async confirmDelete(location: Location) {
        const alert = await this.alertCtrl.create({
            header: 'Confirmar eliminación',
            message: `¿Está seguro de eliminar la ubicación "${location.name}"? Esta acción no se puede deshacer.`,
            cssClass: 'custom-alert',
            buttons: [
                {
                    text: 'Cancelar',
                    role: 'cancel',
                    cssClass: 'alert-button-cancel'
                },
                {
                    text: 'Eliminar',
                    role: 'destructive',
                    cssClass: 'alert-button-delete',
                    handler: () => {
                        this.deleteLocation(location.id);
                    }
                }
            ]
        });

        await alert.present();
    }

    deleteLocation(id: string) {
        this.locationsService.delete(id).subscribe({
            next: () => {
                this.loadLocations();
            },
            error: (error) => {
                console.error('Error deleting location:', error);
            }
        });
    }
}
