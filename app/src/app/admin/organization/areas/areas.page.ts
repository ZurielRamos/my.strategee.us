import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    IonContent,
    IonButton,
    IonIcon,
    IonSpinner
} from '@ionic/angular/standalone';
import { ModalController, AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addOutline, createOutline, trashOutline, eyeOutline, briefcaseOutline } from 'ionicons/icons';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { AreaCardComponent } from './components/area-card/area-card.component';
import { AreasService } from './services/areas.service';
import { Area } from './models/area.model';
import { AreaModalComponent } from './components/area-modal/area-modal.component';

@Component({
    selector: 'app-areas',
    templateUrl: './areas.page.html',
    styleUrls: ['./areas.page.scss'],
    standalone: true,
    providers: [ModalController, AlertController],
    imports: [
        CommonModule,
        FormsModule,
        IonContent,
        IonButton,
        IonIcon,
        IonSpinner,
        PageHeaderComponent,
        AreaCardComponent
    ]
})
export class AreasPage implements OnInit {
    areas: Area[] = [];
    filteredAreas: Area[] = [];
    isLoading = false;
    searchTerm = '';

    constructor(
        private areasService: AreasService,
        private modalCtrl: ModalController,
        private alertCtrl: AlertController
    ) {
        addIcons({ addOutline, createOutline, trashOutline, eyeOutline, briefcaseOutline });
    }

    ngOnInit() {
        this.loadAreas();
    }

    loadAreas() {
        this.isLoading = true;
        this.areasService.getAll().subscribe({
            next: (data) => {
                this.areas = data;
                this.filterAreas();
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading areas:', error);
                this.isLoading = false;
            }
        });
    }

    onSearchChange(searchValue: string) {
        this.searchTerm = searchValue;
        this.filterAreas();
    }

    filterAreas() {
        if (!this.searchTerm.trim()) {
            this.filteredAreas = [...this.areas];
        } else {
            const term = this.searchTerm.toLowerCase().trim();
            this.filteredAreas = this.areas.filter(area =>
                area.name.toLowerCase().includes(term) ||
                area.costCenterCode?.toLowerCase().includes(term) ||
                area.company?.name.toLowerCase().includes(term)
            );
        }
    }

    async openCreateModal() {
        const modal = await this.modalCtrl.create({
            component: AreaModalComponent,
            componentProps: {
                mode: 'create'
            },
            cssClass: 'area-modal',
            backdropDismiss: true
        });

        await modal.present();

        const { role } = await modal.onWillDismiss();
        if (role === 'save') {
            this.loadAreas();
        }
    }

    async openEditModal(area: Area) {
        const modal = await this.modalCtrl.create({
            component: AreaModalComponent,
            componentProps: {
                area,
                mode: 'edit'
            },
            cssClass: 'area-modal',
            backdropDismiss: true
        });

        await modal.present();

        const { role } = await modal.onWillDismiss();
        if (role === 'save') {
            this.loadAreas();
        }
    }

    async confirmDelete(area: Area) {
        const alert = await this.alertCtrl.create({
            header: 'Confirmar eliminación',
            message: `¿Está seguro de eliminar el área "${area.name}"? Esta acción no se puede deshacer.`,
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
                        this.deleteArea(area.id);
                    }
                }
            ]
        });

        await alert.present();
    }

    deleteArea(id: string) {
        this.areasService.delete(id).subscribe({
            next: () => {
                this.loadAreas();
            },
            error: (error) => {
                console.error('Error deleting area:', error);
            }
        });
    }
}
