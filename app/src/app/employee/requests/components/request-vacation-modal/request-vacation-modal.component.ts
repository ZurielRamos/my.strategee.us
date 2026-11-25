import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { informationCircleOutline, alertCircleOutline } from 'ionicons/icons';
import { RequestsService } from '../../services/requests.service';
import { RequestType } from '../../models/request.model';
import { VacationBalance } from '../../models/vacation-balance.model';
import { DateInputComponent, DateValue } from '../../../../shared/components/date-input/date-input.component';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { AlertBoxComponent } from '../../../../shared/components/alert-box/alert-box.component';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
    selector: 'app-request-vacation-modal',
    templateUrl: './request-vacation-modal.component.html',
    styleUrls: ['./request-vacation-modal.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        BaseModalComponent,
        DateInputComponent,
        AlertBoxComponent
    ]
})
export class RequestVacationModalComponent implements OnInit {
    @Input() vacationBalance!: VacationBalance;

    requestForm!: FormGroup;
    isSubmitting = false;
    errorMessage = '';
    totalBusinessDays = 0;
    minDate: Date;
    maxDate: Date;

    constructor(
        private fb: FormBuilder,
        private modalCtrl: ModalController,
        private requestsService: RequestsService,
        private toastService: ToastService
    ) {
        addIcons({ informationCircleOutline, alertCircleOutline });

        // Configurar fechas mínima y máxima
        this.minDate = new Date();
        this.minDate.setHours(0, 0, 0, 0);
        
        this.maxDate = new Date();
        this.maxDate.setFullYear(this.maxDate.getFullYear() + 1); // Permitir hasta 1 año adelante
    }

    ngOnInit() {
        this.requestForm = this.fb.group({
            dateRange: [null, Validators.required]
        });
    }

    onDismiss() {
        this.modalCtrl.dismiss();
    }

    async onConfirm() {
        if (this.requestForm.invalid || this.isSubmitting) {
            return;
        }

        this.isSubmitting = true;
        this.errorMessage = '';

        const dateRange: DateValue = this.requestForm.value.dateRange;
        
        if (!dateRange?.startDate || !dateRange?.endDate) {
            this.errorMessage = 'Debes seleccionar un período válido.';
            this.isSubmitting = false;
            return;
        }

        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        
        // Validar que la fecha de inicio sea anterior o igual a la fecha de fin
        if (startDate > endDate) {
            this.errorMessage = 'La fecha de inicio debe ser anterior o igual a la fecha de fin.';
            this.isSubmitting = false;
            return;
        }

        // Validar que no exceda los días disponibles
        if (this.totalBusinessDays > this.vacationBalance.availableBalance) {
            this.errorMessage = `No tienes suficientes días disponibles. Tienes ${this.vacationBalance.availableBalance} días y estás solicitando ${this.totalBusinessDays} días.`;
            this.isSubmitting = false;
            return;
        }

        const requestDto = {
            type: RequestType.VACATION,
            details: {
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0]
            }
        };

        this.requestsService.createRequest(requestDto).subscribe({
            next: async (response) => {
                await this.toastService.success('Solicitud de vacaciones enviada correctamente');
                this.modalCtrl.dismiss({
                    success: true,
                    request: response,
                    refreshNeeded: true
                }, 'save');
            },
            error: async (error) => {
                console.error('Error creating request:', error);
                
                let errorMessage = 'Error al procesar la solicitud';
                
                if (error.error?.message) {
                    errorMessage = error.error.message;
                } else if (error.message) {
                    errorMessage = error.message;
                } else if (!navigator.onLine) {
                    errorMessage = 'Error de conexión. Intenta nuevamente';
                }
                
                await this.toastService.error(errorMessage);
                this.isSubmitting = false;
            }
        });
    }

    onDateChange(dateValue: DateValue) {
        if (!dateValue?.startDate || !dateValue?.endDate) {
            this.totalBusinessDays = 0;
            return;
        }

        const startDate = new Date(dateValue.startDate);
        const endDate = new Date(dateValue.endDate);
        
        // Calcular días hábiles (excluyendo solo domingos)
        this.totalBusinessDays = this.calculateBusinessDays(startDate, endDate);
        this.validateRange();
    }

    calculateBusinessDays(startDate: Date, endDate: Date): number {
        let count = 0;
        const current = new Date(startDate);
        
        while (current <= endDate) {
            const dayOfWeek = current.getDay();
            // Contar de lunes a sábado (1-6), excluir solo domingos (0)
            if (dayOfWeek !== 0) {
                count++;
            }
            current.setDate(current.getDate() + 1);
        }
        
        return count;
    }

    validateRange() {
        this.errorMessage = '';
        
        if (this.totalBusinessDays > this.vacationBalance.availableBalance) {
            this.errorMessage = `No tienes suficientes días disponibles. Tienes ${this.vacationBalance.availableBalance} días y estás solicitando ${this.totalBusinessDays} días hábiles.`;
            return;
        }
    }

    getFormattedDateRange(): string {
        const dateRange: DateValue = this.requestForm.get('dateRange')?.value;
        
        if (!dateRange?.startDate) return '';
        
        const startDate = new Date(dateRange.startDate);
        const startDay = String(startDate.getDate()).padStart(2, '0');
        const startMonth = String(startDate.getMonth() + 1).padStart(2, '0');
        const startYear = startDate.getFullYear();
        
        if (!dateRange.endDate) {
            return `${startDay}/${startMonth}/${startYear}`;
        }
        
        const endDate = new Date(dateRange.endDate);
        const endDay = String(endDate.getDate()).padStart(2, '0');
        const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
        const endYear = endDate.getFullYear();
        
        if (startDate.getTime() === endDate.getTime()) {
            return `${startDay}/${startMonth}/${startYear}`;
        } else {
            return `${startDay}/${startMonth}/${startYear} al ${endDay}/${endMonth}/${endYear}`;
        }
    }

    get dateRangeControl() {
        return this.requestForm.get('dateRange');
    }

    isDateExceedingQuota = (date: Date, currentSelection?: { start: Date | null; end: Date | null }): boolean => {
        if (!currentSelection?.start) {
            // Si no hay fecha de inicio seleccionada, no hay restricción
            return false;
        }

        const startDate = currentSelection.start;
        const endDate = date;
        
        // Asegurarse de que las fechas estén en el orden correcto
        const start = startDate < endDate ? startDate : endDate;
        const end = startDate < endDate ? endDate : startDate;
        
        // Calcular días hábiles entre las fechas
        const businessDays = this.calculateBusinessDays(start, end);
        
        // Verificar si excede los días disponibles
        return businessDays > this.vacationBalance.availableBalance;
    }
}
