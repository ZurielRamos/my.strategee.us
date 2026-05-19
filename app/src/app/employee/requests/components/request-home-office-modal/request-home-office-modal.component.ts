import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonItem, IonLabel, IonInput, ModalController } from '@ionic/angular/standalone';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { DateInputComponent } from '../../../../shared/components/date-input/date-input.component';
import { AlertBoxComponent } from '../../../../shared/components/alert-box/alert-box.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { RequestsService } from '../../services/requests.service';
import { BenefitAllocation } from '../../../../admin/employees/models/benefit-allocation.model';
import { RequestType } from '../../models/request.model';

@Component({
    selector: 'app-request-home-office-modal',
    templateUrl: './request-home-office-modal.component.html',
    styleUrls: ['./request-home-office-modal.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        BaseModalComponent,
        DateInputComponent,
        AlertBoxComponent,
        IonItem,
        IonLabel,
        IonInput
    ]
})
export class RequestHomeOfficeModalComponent implements OnInit {
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
        // Configurar fechas mínima y máxima
        this.minDate = new Date();
        this.minDate.setHours(0, 0, 0, 0);
        
        this.maxDate = new Date();
        this.maxDate.setMonth(this.maxDate.getMonth() + 3);
    }

    ngOnInit() {
        // Calcular días disponibles
        const availableDays = Math.max(0, this.benefit.monthlyQuota - this.benefitUsage);
        
        this.form = this.fb.group({
            date: ['', Validators.required],
            amount: [1, [Validators.required, Validators.min(0.5), Validators.max(availableDays)]]
        });
    }

    get availableDays(): number {
        return Math.max(0, this.benefit.monthlyQuota - this.benefitUsage);
    }

    get benefitName(): string {
        return this.benefit.benefitType === 'HOME OFFICE' ? 'Home Office' : 'Beneficio';
    }

    async onConfirm() {
        if (this.form.valid && !this.isSubmitting) {
            this.isSubmitting = true;

            const formValue = this.form.value;
            const selectedDate = new Date(formValue.date);
            
            // Validar que no exceda los días disponibles
            if (formValue.amount > this.availableDays) {
                await this.toastService.error(`Solo tienes ${this.availableDays} días disponibles este mes.`);
                this.isSubmitting = false;
                return;
            }
            
            const requestDto = {
                type: RequestType.BENEFIT,
                details: {
                    benefitType: this.benefit.benefitType,
                    date: selectedDate.toISOString().split('T')[0],
                    amount: formValue.amount
                }
            };

            this.requestsService.createRequest(requestDto).subscribe({
                next: async (response) => {
                    await this.toastService.success('Solicitud enviada correctamente');
                    this.modalCtrl.dismiss({
                        success: true,
                        request: response,
                        refreshNeeded: true
                    }, 'save');
                },
                error: async (error) => {
                    console.error('Error creating request:', error);
                    const errorMessage = error.error?.message || error.message || 'Error al procesar la solicitud';
                    await this.toastService.error(errorMessage);
                    this.isSubmitting = false;
                }
            });
        }
    }

    onDismiss() {
        this.modalCtrl.dismiss();
    }
}
