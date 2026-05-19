import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { informationCircleOutline, alertCircleOutline } from 'ionicons/icons';
import { RequestsService } from '../../services/requests.service';
import { RequestType } from '../../models/request.model';
import { GiftedDaysBalance } from '../../models/gifted-days-balance.model';
import { DateInputComponent, DateValue } from '../../../../shared/components/date-input/date-input.component';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { AlertBoxComponent } from '../../../../shared/components/alert-box/alert-box.component';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
    selector: 'app-request-gifted-day-usage-modal',
    templateUrl: './request-gifted-day-usage-modal.component.html',
    styleUrls: ['./request-gifted-day-usage-modal.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        BaseModalComponent,
        DateInputComponent,
        AlertBoxComponent
    ]
})
export class RequestGiftedDayUsageModalComponent implements OnInit {
    @Input() giftedDaysBalance!: GiftedDaysBalance;

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

        this.minDate = new Date();
        this.minDate.setHours(0, 0, 0, 0);

        this.maxDate = new Date();
        this.maxDate.setFullYear(this.maxDate.getFullYear() + 1);
    }

    ngOnInit() {
        this.requestForm = this.fb.group({
            dateRange: [null, Validators.required],
            reason: ['', [Validators.required, Validators.minLength(5)]]
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

        if (startDate > endDate) {
            this.errorMessage = 'La fecha de inicio debe ser anterior o igual a la fecha de fin.';
            this.isSubmitting = false;
            return;
        }

        if (this.totalBusinessDays > this.giftedDaysBalance.availableDays) {
            this.errorMessage = `No tienes suficientes días disponibles. Tienes ${this.giftedDaysBalance.availableDays} días y estás solicitando ${this.totalBusinessDays} días.`;
            this.isSubmitting = false;
            return;
        }

        const requestDto = {
            type: RequestType.GIFTED_DAY_USAGE,
            details: {
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                days: this.totalBusinessDays,
                reason: this.requestForm.value.reason
            }
        };

        this.requestsService.createRequest(requestDto).subscribe({
            next: async (response) => {
                await this.toastService.success('Solicitud de días obsequiados enviada correctamente');
                this.modalCtrl.dismiss({ success: true, request: response, refreshNeeded: true }, 'save');
            },
            error: async (error) => {
                console.error('Error creating request:', error);
                const errorMessage = error.error?.message || error.message || 'Error al procesar la solicitud';
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
        this.totalBusinessDays = this.calculateBusinessDays(startDate, endDate);
        this.validateRange();
    }

    calculateBusinessDays(startDate: Date, endDate: Date): number {
        let count = 0;
        const current = new Date(startDate);
        while (current <= endDate) {
            if (current.getDay() !== 0) count++; // Excluir domingos
            current.setDate(current.getDate() + 1);
        }
        return count;
    }

    validateRange() {
        this.errorMessage = '';
        if (this.totalBusinessDays > this.giftedDaysBalance.availableDays) {
            this.errorMessage = `No tienes suficientes días disponibles. Tienes ${this.giftedDaysBalance.availableDays} días y estás solicitando ${this.totalBusinessDays} días hábiles.`;
        }
    }

    getFormattedDateRange(): string {
        const dateRange: DateValue = this.requestForm.get('dateRange')?.value;
        if (!dateRange?.startDate) return '';

        const fmt = (d: Date) =>
            `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

        const start = new Date(dateRange.startDate);
        if (!dateRange.endDate) return fmt(start);

        const end = new Date(dateRange.endDate);
        return start.getTime() === end.getTime() ? fmt(start) : `${fmt(start)} al ${fmt(end)}`;
    }

    get dateRangeControl() {
        return this.requestForm.get('dateRange');
    }

    isDateExceedingQuota = (date: Date, currentSelection?: { start: Date | null; end: Date | null }): boolean => {
        if (!currentSelection?.start) return false;

        const startDate = currentSelection.start;
        const start = startDate < date ? startDate : date;
        const end = startDate < date ? date : startDate;
        const businessDays = this.calculateBusinessDays(start, end);
        return businessDays > this.giftedDaysBalance.availableDays;
    };
}
