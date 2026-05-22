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
import { ModalController, AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, trashOutline, cashOutline } from 'ionicons/icons';
import { CompensationService } from '../../services/compensation.service';
import { Compensation, getCompensationFrequencyLabel, getCompensationStatusLabel, getCompensationConditionLabel, CompensationCondition } from '../../models/compensation.model';
import { formatCurrency } from '../../../../shared/helpers/currency.helper';

@Component({
    selector: 'app-compensation-history-modal',
    templateUrl: './compensation-history-modal.component.html',
    styleUrls: ['./compensation-history-modal.component.scss'],
    standalone: true,
    providers: [ModalController, AlertController],
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
export class CompensationHistoryModalComponent implements OnInit {
    @Input() employeeId!: string;
    @Input() employeeName!: string;

    compensations: Compensation[] = [];
    isLoading = false;

    constructor(
        private modalCtrl: ModalController,
        private alertCtrl: AlertController,
        private compensationService: CompensationService
    ) {
        addIcons({ closeOutline, trashOutline, cashOutline });
    }

    ngOnInit() {
        this.loadCompensations();
    }

    loadCompensations() {
        this.isLoading = true;
        this.compensationService.getAllByEmployee(this.employeeId).subscribe({
            next: (data) => {
                this.compensations = data;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading compensations:', error);
                this.isLoading = false;
            }
        });
    }

    dismiss() {
        this.modalCtrl.dismiss();
    }

    async confirmCancel(compensation: Compensation) {
        const alert = await this.alertCtrl.create({
            header: 'Cancelar Compensación',
            message: `¿Está seguro de cancelar la compensación "${compensation.concept}"?`,
            cssClass: 'custom-alert',
            buttons: [
                {
                    text: 'No',
                    role: 'cancel',
                    cssClass: 'alert-button-cancel'
                },
                {
                    text: 'Sí, Cancelar',
                    role: 'destructive',
                    cssClass: 'alert-button-delete',
                    handler: () => {
                        this.cancelCompensation(compensation.id);
                    }
                }
            ]
        });

        await alert.present();
    }

    cancelCompensation(id: string) {
        this.compensationService.cancel(id).subscribe({
            next: () => {
                this.loadCompensations();
                this.modalCtrl.dismiss(null, 'cancelled');
            },
            error: (error) => {
                console.error('Error cancelling compensation:', error);
            }
        });
    }

    getFrequencyLabel(frequency: string): string {
        return getCompensationFrequencyLabel(frequency as any);
    }

    getStatusLabel(status: string): string {
        return getCompensationStatusLabel(status as any);
    }

    getStatusColor(status: string): string {
        switch (status) {
            case 'ACTIVE':
                return 'success';
            case 'CANCELLED':
                return 'danger';
            case 'COMPLETED':
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

    canCancel(compensation: Compensation): boolean {
        return compensation.status === 'ACTIVE';
    }

    formatCurrency(amount: number | string | null | undefined): string {
        return formatCurrency(amount);
    }

    getConditionLabel(condition: string): string {
        return getCompensationConditionLabel(condition as CompensationCondition);
    }

    hasCondition(compensation: Compensation): boolean {
        return compensation.condition && compensation.condition !== CompensationCondition.NONE;
    }
}
