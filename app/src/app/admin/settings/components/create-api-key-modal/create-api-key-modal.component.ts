import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonIcon, ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { informationCircleOutline } from 'ionicons/icons';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { TextInputComponent } from '../../../../shared/components/text-input/text-input.component';
import { ApiKeyService } from '../../services/api-key.service';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
    selector: 'app-create-api-key-modal',
    templateUrl: './create-api-key-modal.component.html',
    styleUrls: ['./create-api-key-modal.component.scss'],
    standalone: true,
    providers: [ModalController],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        IonIcon,
        BaseModalComponent,
        TextInputComponent,
    ],
})
export class CreateApiKeyModalComponent implements OnInit {
    form!: FormGroup;
    isSubmitting = false;

    constructor(
        private fb: FormBuilder,
        private modalCtrl: ModalController,
        private apiKeyService: ApiKeyService,
        private toastService: ToastService,
    ) {
        addIcons({ informationCircleOutline });
    }

    ngOnInit() {
        this.form = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
        });
    }

    onDismiss() {
        this.modalCtrl.dismiss(null, 'cancel');
    }

    async onConfirm() {
        if (this.form.invalid || this.isSubmitting) return;

        this.isSubmitting = true;
        const { name } = this.form.value;

        this.apiKeyService.createApiKey(name.trim()).subscribe({
            next: (response) => {
                this.modalCtrl.dismiss(response, 'save');
            },
            error: async (err) => {
                const msg = err?.error?.message || 'No se pudo crear la API Key';
                await this.toastService.show({ message: Array.isArray(msg) ? msg.join(', ') : msg, type: 'error' });
                this.isSubmitting = false;
            },
        });
    }
}
