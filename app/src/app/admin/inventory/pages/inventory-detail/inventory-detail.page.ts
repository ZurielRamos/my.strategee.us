import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
    IonContent,
    IonButton,
    IonIcon,
    IonSpinner,
    AlertController,
    ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    addOutline,
    trashOutline,
    createOutline,
    hardwareChipOutline,
    laptopOutline,
    buildOutline,
    calendarOutline,
    chevronBackOutline,
    chevronForwardOutline,
    alertCircleOutline,
    refreshOutline
} from 'ionicons/icons';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { InventoryAdminService } from '../../services/inventory-admin.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Inventory, InventoryFeature, Maintenance } from '../../models';
import { InventoryFeatureModalComponent } from '../../components/inventory-feature-modal/inventory-feature-modal.component';
import { MaintenanceModalComponent } from '../../components/maintenance-modal/maintenance-modal.component';

@Component({
    selector: 'app-inventory-detail',
    templateUrl: './inventory-detail.page.html',
    styleUrls: ['./inventory-detail.page.scss'],
    standalone: true,
    providers: [ModalController, AlertController],
    imports: [
        CommonModule,
        IonContent,
        IonButton,
        IonIcon,
        IonSpinner,
        PageHeaderComponent
    ]
})
export class InventoryDetailPage implements OnInit {
    inventory: Inventory | null = null;
    isLoading = false;
    hasError = false;

    // Maintenances pagination
    maintenances: Maintenance[] = [];
    maintenancePage = 1;
    maintenanceLimit = 5;
    maintenanceTotalPages = 1;
    isLoadingMaintenances = false;

    private inventoryId!: string;

    constructor(
        private route: ActivatedRoute,
        private inventoryService: InventoryAdminService,
        private modalCtrl: ModalController,
        private alertCtrl: AlertController,
        private toastService: ToastService
    ) {
        addIcons({
            addOutline,
            trashOutline,
            createOutline,
            hardwareChipOutline,
            laptopOutline,
            buildOutline,
            calendarOutline,
            chevronBackOutline,
            chevronForwardOutline,
            alertCircleOutline,
            refreshOutline
        });
    }

    ngOnInit() {
        this.inventoryId = this.route.snapshot.paramMap.get('id')!;
        this.loadInventory();
        this.loadMaintenances();
    }

    loadInventory() {
        this.isLoading = true;
        this.hasError = false;
        this.inventoryService.getInventoryDetail(this.inventoryId).subscribe({
            next: (inventory) => {
                this.inventory = inventory;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading inventory detail:', error);
                this.isLoading = false;
                this.hasError = true;
            }
        });
    }

    loadMaintenances() {
        this.isLoadingMaintenances = true;
        this.inventoryService.getMaintenances(this.maintenancePage, this.maintenanceLimit, '', this.inventoryId).subscribe({
            next: (response) => {
                this.maintenances = response.data;
                this.maintenanceTotalPages = response.meta.totalPages;
                this.isLoadingMaintenances = false;
            },
            error: (error) => {
                console.error('Error loading maintenances:', error);
                this.isLoadingMaintenances = false;
            }
        });
    }

    // ─── Features ───────────────────────────────────────────────────────────

    get hardwareFeatures(): InventoryFeature[] {
        return this.inventory?.features?.filter(f => f.hardwareId) || [];
    }

    get softwareFeatures(): InventoryFeature[] {
        return this.inventory?.features?.filter(f => f.softwareId) || [];
    }

    async openFeatureModal() {
        const modal = await this.modalCtrl.create({
            component: InventoryFeatureModalComponent,
            componentProps: {
                inventoryId: this.inventoryId
            },
            cssClass: 'inventory-feature-modal',
            backdropDismiss: true
        });

        await modal.present();

        const { role } = await modal.onWillDismiss();
        if (role === 'save') {
            this.loadInventory();
        }
    }

    async confirmDeleteFeature(feature: InventoryFeature) {
        const featureName = feature.hardware?.name || feature.software?.name || 'esta característica';
        const alert = await this.alertCtrl.create({
            header: 'Eliminar Característica',
            message: `¿Está seguro de eliminar "${featureName}"?`,
            buttons: [
                { text: 'Cancelar', role: 'cancel' },
                {
                    text: 'Eliminar',
                    role: 'destructive',
                    handler: () => this.deleteFeature(feature)
                }
            ]
        });
        await alert.present();
    }

    private deleteFeature(feature: InventoryFeature) {
        this.inventoryService.removeFeature(this.inventoryId, feature.id).subscribe({
            next: async () => {
                await this.toastService.success('Característica eliminada correctamente');
                this.loadInventory();
            },
            error: async (error) => {
                await this.toastService.error(
                    error.error?.message || 'Error al eliminar la característica'
                );
            }
        });
    }

    // ─── Maintenances ───────────────────────────────────────────────────────

    async openMaintenanceModal(maintenance?: Maintenance) {
        const modal = await this.modalCtrl.create({
            component: MaintenanceModalComponent,
            componentProps: {
                inventoryId: this.inventoryId,
                maintenance: maintenance || undefined,
                mode: maintenance ? 'edit' : 'create'
            },
            cssClass: 'maintenance-modal',
            backdropDismiss: true
        });

        await modal.present();

        const { role } = await modal.onWillDismiss();
        if (role === 'save') {
            this.loadMaintenances();
        }
    }

    async confirmDeleteMaintenance(maintenance: Maintenance) {
        const alert = await this.alertCtrl.create({
            header: 'Eliminar Mantenimiento',
            message: `¿Está seguro de eliminar este mantenimiento del ${this.formatDate(maintenance.maintenanceDate)}?`,
            buttons: [
                { text: 'Cancelar', role: 'cancel' },
                {
                    text: 'Eliminar',
                    role: 'destructive',
                    handler: () => this.deleteMaintenance(maintenance)
                }
            ]
        });
        await alert.present();
    }

    private deleteMaintenance(maintenance: Maintenance) {
        this.inventoryService.deleteMaintenance(maintenance.id).subscribe({
            next: async () => {
                await this.toastService.success('Mantenimiento eliminado correctamente');
                this.loadMaintenances();
            },
            error: async (error) => {
                await this.toastService.error(
                    error.error?.message || 'Error al eliminar el mantenimiento'
                );
            }
        });
    }

    // ─── Pagination ─────────────────────────────────────────────────────────

    previousPage() {
        if (this.maintenancePage > 1) {
            this.maintenancePage--;
            this.loadMaintenances();
        }
    }

    nextPage() {
        if (this.maintenancePage < this.maintenanceTotalPages) {
            this.maintenancePage++;
            this.loadMaintenances();
        }
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    formatDate(date: string | null): string {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatCurrency(value: number): string {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }
}
