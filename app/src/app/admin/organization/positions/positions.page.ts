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
import { PositionCardComponent } from './components/position-card/position-card.component';
import { PositionsService } from './services/positions.service';
import { Position } from './models/position.model';
import { PositionModalComponent } from './components/position-modal/position-modal.component';

@Component({
    selector: 'app-positions',
    templateUrl: './positions.page.html',
    styleUrls: ['./positions.page.scss'],
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
        PositionCardComponent
    ]
})
export class PositionsPage implements OnInit {
    positions: Position[] = [];
    filteredPositions: Position[] = [];
    isLoading = false;
    searchTerm = '';

    constructor(
        private positionsService: PositionsService,
        private modalCtrl: ModalController,
        private alertCtrl: AlertController
    ) {
        addIcons({ addOutline, createOutline, trashOutline, eyeOutline, briefcaseOutline });
    }

    ngOnInit() {
        this.loadPositions();
    }

    loadPositions() {
        this.isLoading = true;
        this.positionsService.getAll().subscribe({
            next: (data) => {
                this.positions = data;
                this.filterPositions();
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading positions:', error);
                this.isLoading = false;
            }
        });
    }

    onSearchChange(searchValue: string) {
        this.searchTerm = searchValue;
        this.filterPositions();
    }

    filterPositions() {
        if (!this.searchTerm.trim()) {
            this.filteredPositions = [...this.positions];
        } else {
            const term = this.searchTerm.toLowerCase().trim();
            this.filteredPositions = this.positions.filter(position =>
                position.name.toLowerCase().includes(term) ||
                position.riskLevel.toLowerCase().includes(term) ||
                position.department?.name.toLowerCase().includes(term) ||
                position.department?.company?.name.toLowerCase().includes(term)
            );
        }
    }

    async openCreateModal() {
        const modal = await this.modalCtrl.create({
            component: PositionModalComponent,
            componentProps: {
                mode: 'create'
            },
            cssClass: 'position-modal',
            backdropDismiss: true
        });

        await modal.present();

        const { role } = await modal.onWillDismiss();
        if (role === 'save') {
            this.loadPositions();
        }
    }

    async openEditModal(position: Position) {
        const modal = await this.modalCtrl.create({
            component: PositionModalComponent,
            componentProps: {
                position,
                mode: 'edit'
            },
            cssClass: 'position-modal',
            backdropDismiss: true
        });

        await modal.present();

        const { role } = await modal.onWillDismiss();
        if (role === 'save') {
            this.loadPositions();
        }
    }

    async openViewModal(position: Position) {
        // View mode removed - now we just open edit modal directly
        this.openEditModal(position);
    }

    async confirmDelete(position: Position) {
        const alert = await this.alertCtrl.create({
            header: 'Confirmar eliminación',
            message: `¿Está seguro de eliminar el cargo "${position.name}"? Esta acción no se puede deshacer.`,
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
                        this.deletePosition(position.id);
                    }
                }
            ]
        });

        await alert.present();
    }

    deletePosition(id: string) {
        this.positionsService.delete(id).subscribe({
            next: () => {
                this.loadPositions();
            },
            error: (error) => {
                console.error('Error deleting position:', error);
            }
        });
    }
}
