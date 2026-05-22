import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowForwardOutline } from 'ionicons/icons';
import { ModalController } from '@ionic/angular/standalone';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { FormSelectComponent, SelectOption } from '../../../../shared/components/form-select/form-select.component';
import { TextInputComponent } from '../../../../shared/components/text-input/text-input.component';
import { TextareaInputComponent } from '../../../../shared/components/textarea-input/textarea-input.component';
import { AlertBoxComponent } from '../../../../shared/components/alert-box/alert-box.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { CompensatedTimeService } from '../../../../employee/requests/services/compensated-time.service';

@Component({
    selector: 'app-compensated-time-adjustment-modal',
    templateUrl: './compensated-time-adjustment-modal.component.html',
    styleUrls: ['./compensated-time-adjustment-modal.component.scss'],
    standalone: true,
    providers: [ModalController],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        BaseModalComponent,
        FormSelectComponent,
        TextInputComponent,
        TextareaInputComponent,
        AlertBoxComponent,
        IonIcon
    ]
})
export class CompensatedTimeAdjustmentModalComponent implements OnInit {
    @Input() employeeId!: string;
    @Input() employeeName!: string;
    @Input() currentBalance: number = 0;

    form!: FormGroup;
    isSubmitting = false;

    constructor(
        private fb: FormBuilder,
        private modalCtrl: ModalController,
        private toastService: ToastService,
        private compensatedTimeService: CompensatedTimeService
    ) {
        addIcons({ arrowForwardOutline });
    }

    ngOnInit() {
        this.form = this.fb.group({
            type: ['ADD', Validators.required],
            hours: [null, [Validators.required, Validators.min(0.5), Validators.max(240)]],
            reason: ['', [Validators.required, Validators.maxLength(500)]]
        });
    }

    get adjustmentTypeOptions(): SelectOption[] {
        return [
            { value: 'ADD', label: 'Agregar horas' },
            { value: 'SUBTRACT', label: 'Quitar horas' }
        ];
    }

    get newBalance(): number {
        const type = this.form.get('type')?.value;
        const hours = this.form.get('hours')?.value || 0;
        
        if (type === 'ADD') {
            return this.currentBalance + hours;
        } else {
            return Math.max(0, this.currentBalance - hours);
        }
    }

    onConfirm() {
        if (this.form.valid && !this.isSubmitting) {
            this.isSubmitting = true;
            
            const formValue = this.form.value;
            const adjustmentData = {
                employeeId: this.employeeId,
                type: formValue.type,
                hours: formValue.hours,
                reason: formValue.reason
            };

            this.compensatedTimeService.adjustBalance(adjustmentData).subscribe({
                next: async (response) => {
                    await this.toastService.success('Ajuste de horas compensatorias guardado correctamente');
                    this.modalCtrl.dismiss(adjustmentData, 'save');
                },
                error: async (error) => {
                    await this.toastService.error(
                        error.message || 'Error al guardar el ajuste de horas compensatorias'
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
