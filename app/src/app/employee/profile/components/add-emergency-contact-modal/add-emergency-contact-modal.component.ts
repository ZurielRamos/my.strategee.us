import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { TextInputComponent } from '../../../../shared/components/text-input/text-input.component';
import { EmergencyContactsService } from '../../../../shared/services/emergency-contacts.service';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
    selector: 'app-add-emergency-contact-modal',
    templateUrl: './add-emergency-contact-modal.component.html',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        BaseModalComponent,
        TextInputComponent,
    ],
})
export class AddEmergencyContactModalComponent implements OnInit {
    form!: FormGroup;
    isSubmitting = false;

    constructor(
        private fb: FormBuilder,
        private modalCtrl: ModalController,
        private emergencyContactsService: EmergencyContactsService,
        private toastService: ToastService,
    ) {}

    ngOnInit() {
        this.form = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
            relationship: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
            phone: ['', [Validators.required, Validators.minLength(7), Validators.maxLength(20)]],
            email: ['', [Validators.email]],
        });
    }

    onDismiss() {
        this.modalCtrl.dismiss(null, 'cancel');
    }

    async onConfirm() {
        if (this.form.invalid || this.isSubmitting) return;

        this.isSubmitting = true;
        const { name, relationship, phone, email } = this.form.value;

        this.emergencyContactsService.createMyContact({
            name: name.trim(),
            relationship: relationship.trim(),
            phone: phone.trim(),
            email: email?.trim() || undefined,
        }).subscribe({
            next: async (contact) => {
                await this.toastService.success('Contacto de emergencia agregado');
                this.modalCtrl.dismiss({ contact }, 'save');
            },
            error: async (err) => {
                const msg = err?.error?.message || 'No se pudo agregar el contacto';
                await this.toastService.error(Array.isArray(msg) ? msg.join(', ') : msg);
                this.isSubmitting = false;
            },
        });
    }
}
