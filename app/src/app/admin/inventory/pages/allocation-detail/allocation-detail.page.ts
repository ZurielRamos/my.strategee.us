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
    personOutline,
    laptopOutline,
    documentTextOutline,
    checkmarkCircleOutline,
    timeOutline,
    sendOutline,
    downloadOutline,
    alertCircleOutline,
    refreshOutline
} from 'ionicons/icons';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { InventoryAdminService } from '../../services/inventory-admin.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { InventoryAllocation, AllocationElement } from '../../models';
import { AllocationElementModalComponent } from '../../components/allocation-element-modal/allocation-element-modal.component';

@Component({
    selector: 'app-allocation-detail',
    templateUrl: './allocation-detail.page.html',
    styleUrls: ['./allocation-detail.page.scss'],
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
export class AllocationDetailPage implements OnInit {
    allocation: InventoryAllocation | null = null;
    isLoading = false;
    hasError = false;
    isSendingFormat = false;
    isDownloadingPdf = false;

    private allocationId!: string;

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
            personOutline,
            laptopOutline,
            documentTextOutline,
            checkmarkCircleOutline,
            timeOutline,
            sendOutline,
            downloadOutline,
            alertCircleOutline,
            refreshOutline
        });
    }

    ngOnInit() {
        this.allocationId = this.route.snapshot.paramMap.get('id')!;
        this.loadAllocation();
    }

    loadAllocation() {
        this.isLoading = true;
        this.hasError = false;
        this.inventoryService.getAllocationDetail(this.allocationId).subscribe({
            next: (allocation) => {
                this.allocation = allocation;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading allocation detail:', error);
                this.isLoading = false;
                this.hasError = true;
            }
        });
    }

    // ─── Elements ───────────────────────────────────────────────────────────

    get isFormatAccepted(): boolean {
        return this.allocation?.receptionFormat?.isAccepted === true;
    }

    async openElementModal() {
        const modal = await this.modalCtrl.create({
            component: AllocationElementModalComponent,
            componentProps: {
                allocationId: this.allocationId
            },
            cssClass: 'allocation-element-modal',
            backdropDismiss: true
        });

        await modal.present();

        const { role } = await modal.onWillDismiss();
        if (role === 'save') {
            this.loadAllocation();
        }
    }

    async confirmDeleteElement(element: AllocationElement) {
        if (this.isFormatAccepted) {
            await this.toastService.error(
                'No se pueden eliminar elementos después de que el formato de recepción ha sido aceptado'
            );
            return;
        }

        const elementName = element.additionalElement?.name || 'este elemento';
        const alert = await this.alertCtrl.create({
            header: 'Eliminar Elemento',
            message: `¿Está seguro de eliminar "${elementName}"?`,
            buttons: [
                { text: 'Cancelar', role: 'cancel' },
                {
                    text: 'Eliminar',
                    role: 'destructive',
                    handler: () => this.deleteElement(element)
                }
            ]
        });
        await alert.present();
    }

    private deleteElement(element: AllocationElement) {
        this.inventoryService.removeAllocationElement(this.allocationId, element.id).subscribe({
            next: async () => {
                await this.toastService.success('Elemento eliminado correctamente');
                this.loadAllocation();
            },
            error: async (error) => {
                await this.toastService.error(
                    error.error?.message || 'Error al eliminar el elemento'
                );
            }
        });
    }

    // ─── Reception Format ───────────────────────────────────────────────────

    sendReceptionFormat() {
        this.isSendingFormat = true;
        this.inventoryService.sendReceptionFormat(this.allocationId).subscribe({
            next: async () => {
                await this.toastService.success('Formato de recepción enviado correctamente');
                this.isSendingFormat = false;
                this.loadAllocation();
            },
            error: async (error) => {
                await this.toastService.error(
                    error.error?.message || 'Error al enviar el formato de recepción'
                );
                this.isSendingFormat = false;
            }
        });
    }

    downloadPdf() {
        this.isDownloadingPdf = true;
        this.inventoryService.getReceptionPdf(this.allocationId).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `formato-recepcion-${this.allocationId}.pdf`;
                link.click();
                window.URL.revokeObjectURL(url);
                this.isDownloadingPdf = false;
            },
            error: async (error) => {
                await this.toastService.error(
                    error.error?.message || 'Error al descargar el PDF'
                );
                this.isDownloadingPdf = false;
            }
        });
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    formatCurrency(value: number): string {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }

    formatDate(date: string | null): string {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatDateTime(date: string | null): string {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}
