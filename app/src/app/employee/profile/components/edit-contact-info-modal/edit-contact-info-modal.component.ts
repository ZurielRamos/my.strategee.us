import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { TextInputComponent } from '../../../../shared/components/text-input/text-input.component';
import { TextareaInputComponent } from '../../../../shared/components/textarea-input/textarea-input.component';
import { EmployeesService } from '../../../../admin/employees/services/employees.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { AuthService } from '../../../../auth/services/auth.service';

@Component({
    selector: 'app-edit-contact-info-modal',
    templateUrl: './edit-contact-info-modal.component.html',
    standalone: true,
    providers: [ModalController],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        BaseModalComponent,
        TextInputComponent,
        TextareaInputComponent,
    ],
})
export class EditContactInfoModalComponent implements OnInit {
    @Input() currentAddress: string = '';
    @Input() currentPhone: string = '';
    @Input() currentPersonalEmail: string = '';

    form!: FormGroup;
    isSubmitting = false;

    constructor(
        private fb: FormBuilder,
        private modalCtrl: ModalController,
        private employeesService: EmployeesService,
        private toastService: ToastService,
        private authService: AuthService,
    ) {}

    ngOnInit() {
        this.form = this.fb.group({
            address: [this.currentAddress || '', []],
            phone: [this.currentPhone || '', [Validators.required, Validators.minLength(7), Validators.maxLength(20)]],
            personalEmail: [this.currentPersonalEmail || '', [Validators.required, Validators.email]],
        });
    }

    onDismiss() {
        this.modalCtrl.dismiss(null, 'cancel');
    }

    async onConfirm() {
        if (this.form.invalid || this.isSubmitting) return;

        this.isSubmitting = true;
        const { address, phone, personalEmail } = this.form.value;

        this.employeesService.updateMyContactInfo({ address, phone, personalEmail }).subscribe({
            next: async () => {
                await this.toastService.success('Datos de contacto actualizados');
                this.authService.refreshUserProfile().subscribe();
                this.modalCtrl.dismiss({ updated: true }, 'save');
            },
            error: async (err) => {
                const msg = err?.error?.message || 'No se pudo actualizar la información';
                await this.toastService.error(Array.isArray(msg) ? msg.join(', ') : msg);
                this.isSubmitting = false;
            },
        });
    }
}
