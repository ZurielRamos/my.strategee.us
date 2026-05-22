import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import { AuthService } from '../../../../auth/services/auth.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { TextInputComponent } from '../../../../shared/components/text-input/text-input.component';
import { AlertBoxComponent } from '../../../../shared/components/alert-box/alert-box.component';

@Component({
    selector: 'app-change-password-modal',
    templateUrl: './change-password-modal.component.html',
    styleUrls: ['./change-password-modal.component.scss'],
    standalone: true,
    providers: [ModalController],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        BaseModalComponent,
        TextInputComponent,
        AlertBoxComponent
    ]
})
export class ChangePasswordModalComponent implements OnInit {
    passwordForm!: FormGroup;
    isSubmitting = false;

    constructor(
        private fb: FormBuilder,
        private modalCtrl: ModalController,
        private authService: AuthService,
        private toastService: ToastService
    ) {}

    ngOnInit() {
        this.initForm();
    }

    initForm() {
        this.passwordForm = this.fb.group({
            currentPassword: ['', [Validators.required]],
            newPassword: ['', [Validators.required, Validators.minLength(8)]],
            confirmPassword: ['', [Validators.required]]
        }, {
            validators: this.passwordMatchValidator
        });
    }

    passwordMatchValidator(group: FormGroup) {
        const newPassword = group.get('newPassword')?.value;
        const confirmPassword = group.get('confirmPassword')?.value;
        return newPassword === confirmPassword ? null : { passwordMismatch: true };
    }

    onDismiss() {
        this.modalCtrl.dismiss();
    }

    async onConfirm() {
        if (this.passwordForm.valid && !this.isSubmitting) {
            this.isSubmitting = true;
            
            const { currentPassword, newPassword } = this.passwordForm.value;
            
            this.authService.changePassword(currentPassword, newPassword).subscribe({
                next: async () => {
                    await this.toastService.success('Contraseña cambiada correctamente');
                    this.modalCtrl.dismiss(true, 'save');
                },
                error: async (error) => {
                    await this.toastService.error(
                        error?.error?.message || 'Error al cambiar la contraseña'
                    );
                    this.isSubmitting = false;
                }
            });
        }
    }

    get hasPasswordMismatch(): boolean {
        const confirmControl = this.passwordForm.get('confirmPassword');
        return this.passwordForm.hasError('passwordMismatch') && 
               confirmControl?.touched === true;
    }
}
