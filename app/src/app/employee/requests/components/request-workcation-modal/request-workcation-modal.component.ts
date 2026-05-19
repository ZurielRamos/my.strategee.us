import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import { RequestsService } from '../../services/requests.service';
import { BenefitAllocation } from '../../../../admin/employees/models/benefit-allocation.model';
import { RequestType } from '../../models/request.model';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { DateInputComponent } from '../../../../shared/components/date-input/date-input.component';
import { AlertBoxComponent } from '../../../../shared/components/alert-box/alert-box.component';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
    selector: 'app-request-workcation-modal',
    templateUrl: './request-workcation-modal.component.html',
    styleUrls: ['./request-workcation-modal.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        BaseModalComponent,
        DateInputComponent,
        AlertBoxComponent
    ]
})
export class RequestWorkcationModalComponent implements OnInit {
    @Input() benefit!: BenefitAllocation;
    @Input() benefitUsage: number = 0; // Días usados + pendientes

    form!: FormGroup;
    isSubmitting = false;
    minDate: Date;
    maxDate: Date;

    constructor(
        private fb: FormBuilder,
        private modalCtrl: ModalController,
        private requestsService: RequestsService,
        private toastService: ToastService
    ) {
        // Configurar fechas mínimas y máximas
        this.minDate = new Date();
        this.minDate.setHours(0, 0, 0, 0);
        
        this.maxDate = new Date();
        this.maxDate.setMonth(this.maxDate.getMonth() + 3);
    }

    ngOnInit() {
        this.form = this.fb.group({
            workcationPeriod: ['', [Validators.required]]
        });
    }

    // Validador personalizado para verificar que no exceda la cuota disponible
    validateQuota = (date: Date, currentSelection?: { start: Date | null; end: Date | null }): boolean => {
        if (!currentSelection?.start) {
            return false;
        }

        const startDate = currentSelection.start;
        const endDate = date;
        
        // Asegurarse de que las fechas estén en el orden correcto
        const start = startDate < endDate ? startDate : endDate;
        const end = startDate < endDate ? endDate : startDate;
        
        // Calcular días entre las fechas
        const timeDiff = Math.abs(end.getTime() - start.getTime());
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
        
        // Calcular días disponibles (cuota mensual - días usados + pendientes)
        const availableDays = Math.max(0, this.benefit.monthlyQuota - this.benefitUsage);
        
        // Retornar true para deshabilitar la fecha si excede los días disponibles
        return daysDiff > availableDays;
    }

    get availableDays(): number {
        return Math.max(0, this.benefit.monthlyQuota - this.benefitUsage);
    }

    get selectedDays(): number {
        const period = this.form.get('workcationPeriod')?.value;
        if (!period?.startDate || !period?.endDate) {
            return 0;
        }

        const start = new Date(period.startDate);
        const end = new Date(period.endDate);
        const timeDiff = end.getTime() - start.getTime();
        return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
    }

    async onConfirm() {
        if (this.form.valid && !this.isSubmitting) {
            this.isSubmitting = true;
            
            const period = this.form.get('workcationPeriod')?.value;
            const days = this.selectedDays;

            const requestDto = {
                type: RequestType.BENEFIT,
                details: {
                    benefitType: this.benefit.benefitType,
                    startDate: period.startDate,
                    endDate: period.endDate,
                    date: period.startDate, // Para compatibilidad con el backend
                    amount: days
                }
            };

            this.requestsService.createRequest(requestDto).subscribe({
                next: async (response) => {
                    await this.toastService.success('Solicitud de workcation enviada correctamente');
                    this.modalCtrl.dismiss({
                        success: true,
                        request: response,
                        refreshNeeded: true
                    }, 'save');
                },
                error: async (error) => {
                    await this.toastService.error(
                        error.error?.message || error.message || 'Error al enviar la solicitud'
                    );
                    this.isSubmitting = false;
                }
            });
        }
    }

    onDismiss() {
        this.modalCtrl.dismiss();
    }
}