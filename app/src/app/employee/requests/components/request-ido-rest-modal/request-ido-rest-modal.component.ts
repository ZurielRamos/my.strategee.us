import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { DateInputComponent } from '../../../../shared/components/date-input/date-input.component';
import { AlertBoxComponent } from '../../../../shared/components/alert-box/alert-box.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { RequestsService } from '../../services/requests.service';
import { BenefitAllocation } from '../../../../admin/employees/models/benefit-allocation.model';
import { RequestType } from '../../models/request.model';

@Component({
    selector: 'app-request-ido-rest-modal',
    templateUrl: './request-ido-rest-modal.component.html',
    styleUrls: ['./request-ido-rest-modal.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        BaseModalComponent,
        DateInputComponent,
        AlertBoxComponent
    ]
})
export class RequestIdoRestModalComponent implements OnInit {
    @Input() benefit!: BenefitAllocation;
    @Input() benefitUsage: number = 0; // Días usados + pendientes (para consistencia)

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
        this.form = this.fb.group({
            date: ['', Validators.required]
        });
    }

    // Validador personalizado para solo permitir sábados
    customValidator = (date: Date): boolean => {
        // Retorna true para deshabilitar la fecha
        // Deshabilitar todos los días excepto sábado (6)
        return date.getDay() !== 6;
    }

    async onConfirm() {
        if (this.form.valid && !this.isSubmitting) {
            this.isSubmitting = true;

            const formValue = this.form.value;
            const selectedDate = new Date(formValue.date);
            
            const requestDto = {
                type: RequestType.BENEFIT,
                details: {
                    benefitType: this.benefit.benefitType,
                    date: selectedDate.toISOString().split('T')[0],
                    amount: 1 // Siempre 1 día para sábado de descanso
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
