import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonSpinner,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonBadge,
    IonChip,
    IonLabel
} from '@ionic/angular/standalone';
import { ModalController, AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { closeOutline, trashOutline, briefcaseOutline, checkmarkCircleOutline, pauseCircleOutline, chevronUpOutline, chevronDownOutline } from 'ionicons/icons';
import { ContractsService } from '../../services/contracts.service';
import { Contract, getContractStatusLabel, getMemorandumStatus, getMemorandumStatusLabel } from '../../models/contract.model';
import { formatCurrency } from '../../../../shared/helpers/currency.helper';

@Component({
    selector: 'app-contract-history-modal',
    templateUrl: './contract-history-modal.component.html',
    styleUrls: ['./contract-history-modal.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonButtons,
        IonButton,
        IonIcon,
        IonContent,
        IonSpinner,
        IonCard,
        IonCardHeader,
        IonCardTitle,
        IonCardContent,
        IonBadge,
        IonChip,
        IonLabel
    ]
})
export class ContractHistoryModalComponent implements OnInit {
    @Input() employeeId!: string;
    @Input() employeeName!: string;

    contracts: Contract[] = [];
    isLoading = false;
    expandedMemorandums: Set<string> = new Set();

    constructor(
        private modalCtrl: ModalController,
        private alertCtrl: AlertController,
        private contractsService: ContractsService
    ) {
        addIcons({ closeOutline, trashOutline, briefcaseOutline, checkmarkCircleOutline, pauseCircleOutline, chevronUpOutline, chevronDownOutline });
    }

    ngOnInit() {
        this.loadContracts();
    }

    loadContracts() {
        this.isLoading = true;
        this.contractsService.getAllByEmployee(this.employeeId).subscribe({
            next: (data) => {
                this.contracts = data;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading contracts:', error);
                this.isLoading = false;
            }
        });
    }

    dismiss() {
        this.modalCtrl.dismiss();
    }

    async confirmCancel(contract: Contract) {
        const alert = await this.alertCtrl.create({
            header: 'Liquidar Contrato',
            message: `¿Está seguro de liquidar el contrato #${contract.contractNumber || contract.id.substring(0, 8)}?`,
            cssClass: 'custom-alert',
            buttons: [
                {
                    text: 'No',
                    role: 'cancel',
                    cssClass: 'alert-button-cancel'
                },
                {
                    text: 'Sí, Liquidar',
                    role: 'destructive',
                    cssClass: 'alert-button-delete',
                    handler: () => {
                        this.cancelContract(contract.id);
                    }
                }
            ]
        });

        await alert.present();
    }

    cancelContract(id: string) {
        this.contractsService.cancel(id).subscribe({
            next: () => {
                this.loadContracts();
                this.modalCtrl.dismiss(null, 'cancelled');
            },
            error: (error) => {
                console.error('Error cancelling contract:', error);
            }
        });
    }

    async confirmActivate(contract: Contract) {
        const alert = await this.alertCtrl.create({
            header: 'Activar Contrato',
            message: `¿Está seguro de activar el contrato #${contract.contractNumber || contract.id.substring(0, 8)}? Esto liquidará el contrato activo previo si existe.`,
            cssClass: 'custom-alert',
            buttons: [
                {
                    text: 'No',
                    role: 'cancel',
                    cssClass: 'alert-button-cancel'
                },
                {
                    text: 'Sí, Activar',
                    cssClass: 'alert-button-confirm',
                    handler: () => {
                        this.activateContract(contract.id);
                    }
                }
            ]
        });

        await alert.present();
    }

    activateContract(id: string) {
        this.contractsService.activate(id).subscribe({
            next: () => {
                this.loadContracts();
                this.modalCtrl.dismiss(null, 'activated');
            },
            error: (error) => {
                console.error('Error activating contract:', error);
            }
        });
    }

    async confirmSuspend(contract: Contract) {
        const alert = await this.alertCtrl.create({
            header: 'Suspender Contrato',
            message: `¿Está seguro de suspender el contrato #${contract.contractNumber || contract.id.substring(0, 8)}?`,
            cssClass: 'custom-alert',
            buttons: [
                {
                    text: 'No',
                    role: 'cancel',
                    cssClass: 'alert-button-cancel'
                },
                {
                    text: 'Sí, Suspender',
                    cssClass: 'alert-button-warning',
                    handler: () => {
                        this.suspendContract(contract.id);
                    }
                }
            ]
        });

        await alert.present();
    }

    suspendContract(id: string) {
        this.contractsService.suspend(id).subscribe({
            next: () => {
                this.loadContracts();
                this.modalCtrl.dismiss(null, 'suspended');
            },
            error: (error) => {
                console.error('Error suspending contract:', error);
            }
        });
    }

    getStatusLabel(status: string): string {
        return getContractStatusLabel(status as any);
    }

    getMemoStatusLabel(status: string): string {
        return getMemorandumStatusLabel(status as any);
    }

    getMemorandumStatusFromDates(memorandum: any): 'ACTIVE' | 'PENDING' | 'EXPIRED' {
        return getMemorandumStatus(memorandum);
    }

    getMemorandumStatusColor(status: 'ACTIVE' | 'PENDING' | 'EXPIRED'): string {
        switch (status) {
            case 'ACTIVE':
                return 'success';
            case 'PENDING':
                return 'warning';
            case 'EXPIRED':
                return 'medium';
            default:
                return 'medium';
        }
    }

    toggleMemorandums(contractId: string) {
        if (this.expandedMemorandums.has(contractId)) {
            this.expandedMemorandums.delete(contractId);
        } else {
            this.expandedMemorandums.add(contractId);
        }
    }

    isMemorandumsExpanded(contractId: string): boolean {
        return this.expandedMemorandums.has(contractId);
    }

    getSortedMemorandums(memorandums: any[]): any[] {
        if (!memorandums) return [];
        // Ordenar por fecha de inicio descendente (más reciente primero)
        return [...memorandums].sort((a, b) => 
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
    }

    /**
     * Determina si un memorando es el activo actual
     * Solo el memorando con la fecha de inicio más reciente que ya haya comenzado
     * se considera activo, independientemente de si hay otros memorandos vigentes
     */
    isActiveMemorandum(contract: Contract, memo: any): boolean {
        if (!contract.memorandums || contract.memorandums.length === 0) {
            return false;
        }

        const now = new Date();
        now.setHours(0, 0, 0, 0); // Normalizar a medianoche para comparación de fechas

        // Filtrar memorandos que ya han comenzado
        const startedMemorandums = contract.memorandums.filter(m => {
            const startDate = new Date(m.startDate);
            startDate.setHours(0, 0, 0, 0);
            
            // Debe haber comenzado
            return startDate <= now;
        });

        // Si no hay memorandos que hayan comenzado, ninguno es activo
        if (startedMemorandums.length === 0) {
            return false;
        }

        // Ordenar por fecha de inicio descendente y tomar el más reciente
        const sortedStarted = startedMemorandums.sort((a, b) => 
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );

        // El activo es el más reciente que ya comenzó
        return sortedStarted[0].id === memo.id;
    }

    /**
     * Obtiene el estado visual del memorando para el badge
     */
    getMemorandumDisplayStatus(contract: Contract, memo: any): 'ACTIVE' | 'PENDING' | 'EXPIRED' {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        const startDate = new Date(memo.startDate);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = memo.endDate ? new Date(memo.endDate) : null;
        if (endDate) {
            endDate.setHours(23, 59, 59, 999);
        }

        // Si es el memorando activo (el más reciente que ya comenzó)
        if (this.isActiveMemorandum(contract, memo)) {
            return 'ACTIVE';
        }

        // Si aún no ha comenzado
        if (startDate > now) {
            return 'PENDING';
        }

        // Si ya expiró o fue reemplazado por uno más reciente
        return 'EXPIRED';
    }

    /**
     * Verifica si el contrato tiene al menos un memorando activo
     */
    hasActiveMemorandum(contract: Contract): boolean {
        if (!contract.memorandums || contract.memorandums.length === 0) {
            return false;
        }

        return contract.memorandums.some(memo => this.isActiveMemorandum(contract, memo));
    }

    isCurrentMemorandum(contract: Contract, memo: any): boolean {
        return contract.currentMemorandum?.id === memo.id;
    }

    async confirmDeleteMemorandum(memo: any) {
        const alert = await this.alertCtrl.create({
            header: 'Eliminar Memorando',
            message: `¿Está seguro de eliminar este memorando pendiente? Esta acción no se puede deshacer.`,
            cssClass: 'custom-alert',
            buttons: [
                {
                    text: 'No',
                    role: 'cancel',
                    cssClass: 'alert-button-cancel'
                },
                {
                    text: 'Sí, Eliminar',
                    role: 'destructive',
                    cssClass: 'alert-button-delete',
                    handler: () => {
                        this.deleteMemorandum(memo.id);
                    }
                }
            ]
        });

        await alert.present();
    }

    deleteMemorandum(memorandumId: string) {
        this.contractsService.deleteMemorandum(memorandumId).subscribe({
            next: () => {
                this.loadContracts();
            },
            error: (error) => {
                console.error('Error deleting memorandum:', error);
            }
        });
    }

    getStatusColor(status: string): string {
        switch (status) {
            case 'ACTIVE':
                return 'success';
            case 'DRAFT':
                return 'warning';
            case 'LIQUIDATED':
                return 'danger';
            case 'SUSPENDED':
                return 'medium';
            default:
                return 'medium';
        }
    }

    formatDate(date: string | Date): string {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatCurrency(amount: number | string | null | undefined): string {
        return formatCurrency(amount);
    }

    canCancel(contract: Contract): boolean {
        return contract.status === 'ACTIVE';
    }

    canActivate(contract: Contract): boolean {
        return contract.status === 'DRAFT' || contract.status === 'SUSPENDED';
    }

    canSuspend(contract: Contract): boolean {
        return contract.status === 'ACTIVE';
    }
}
