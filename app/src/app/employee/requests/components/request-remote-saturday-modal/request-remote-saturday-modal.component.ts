import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonIcon, ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline } from 'ionicons/icons';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { DateInputComponent } from '../../../../shared/components/date-input/date-input.component';
import { AlertBoxComponent } from '../../../../shared/components/alert-box/alert-box.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { RequestsService } from '../../services/requests.service';
import { BenefitAllocation } from '../../../../admin/employees/models/benefit-allocation.model';
import { RequestType } from '../../models/request.model';

@Component({
    selector: 'app-request-remote-saturday-modal',
    templateUrl: './request-remote-saturday-modal.component.html',
    styleUrls: ['./request-remote-saturday-modal.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        IonIcon,
        BaseModalComponent,
        DateInputComponent,
        AlertBoxComponent
    ]
})
export class RequestRemoteSaturdayModalComponent implements OnInit {
    @Input() benefit!: BenefitAllocation;
    @Input() benefitUsage: number = 0;

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
        addIcons({ calendarOutline });

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

    async onConfirm() {
        if (this.form.valid && !this.isSubmitting) {
            this.isSubmitting = true;

            const formValue = this.form.value;
            
            const requestDto = {
                type: RequestType.BENEFIT,
                details: {
                    benefitType: this.benefit.benefitType,
                    date: formValue.date,
                    amount: 1
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