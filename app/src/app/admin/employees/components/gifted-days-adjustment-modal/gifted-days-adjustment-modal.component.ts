import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowForwardOutline } from 'ionicons/icons';
import { ModalController } from '@ionic/angular';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { FormSelectComponent, SelectOption } from '../../../../shared/components/form-select/form-select.component';
import { TextInputComponent } from '../../../../shared/components/text-input/text-input.component';
import { TextareaInputComponent } from '../../../../shared/components/textarea-input/textarea-input.component';
import { AlertBoxComponent } from '../../../../shared/components/alert-box/alert-box.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { GiftedDaysAdminService } from '../../../../shared/services/gifted-days-admin.service';

@Component({
    selector: 'app-gifted-days-adjustment-modal',
    templateUrl: './gifted-days-adjustment-modal.component.html',
    styleUrls: ['./gifted-days-adjustment-modal.component.scss'],
    standalone: true,
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
export class GiftedDaysAdjustmentModalComponent implements OnInit {
    @Input() employeeId!: string;
    @Input() employeeName!: string;
    @Input() currentBalance: number = 0;

    form!: FormGroup;
    isSubmitting = false;

    constructor(
        private fb: FormBuilder,
        private modalCtrl: ModalController,
        private toastService: ToastService,
        private giftedDaysAdminService: GiftedDaysAdminService
    ) {
        addIcons({ arrowForwardOutline });
    }

    ngOnInit() {
        this.form = this.fb.group({
            type: ['ADD', Validators.required],
            days: [null, [Validators.required, Validators.min(0.5), Validators.max(365)]],
            reason: ['', [Validators.required, Validators.maxLength(500)]]
        });
    }

    get adjustmentTypeOptions(): SelectOption[] {
        return [
            { value: 'ADD', label: 'Incremento - Agregar días' },
            { value: 'SUBTRACT', label: 'Decremento - Quitar días' }
        ];
    }

    get newBalance(): number {
        const type = this.form.get('type')?.value;
        const days = this.form.get('days')?.value || 0;
        return type === 'ADD'
            ? this.currentBalance + days
            : Math.max(0, this.currentBalance - days);
    }

    onDismiss() {
        this.modalCtrl.dismiss();
    }

    onConfirm() {
        if (this.form.valid && !this.isSubmitting) {
            this.isSubmitting = true;

            const { type, days, reason } = this.form.value;
            const signedDays = type === 'ADD' ? Math.abs(days) : -Math.abs(days);

            this.giftedDaysAdminService.adjustBalance(this.employeeId, signedDays, reason).subscribe({
                next: async () => {
                    const actionText = type === 'ADD' ? 'agregados' : 'restados';
                    await this.toastService.success(
                        `Se han ${actionText} ${days} día(s) obsequiado(s) correctamente`
                    );
                    this.modalCtrl.dismiss({ newBalance: this.newBalance }, 'save');
                },
                error: async (error) => {
                    await this.toastService.error(
                        error.error?.message || 'Error al ajustar los días obsequiados'
                    );
                    this.isSubmitting = false;
                }
            });
        }
    }
}
