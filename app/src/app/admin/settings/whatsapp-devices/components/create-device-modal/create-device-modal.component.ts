import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonInput, IonItem, IonLabel, IonList, ModalController } from '@ionic/angular/standalone';
import { BaseModalComponent } from '../../../../../shared/components/base-modal/base-modal.component';
import { WhatsappService } from '../../../services/whatsapp.service';
import { ToastService } from '../../../../../shared/services/toast.service';

@Component({
    selector: 'app-create-device-modal',
    templateUrl: './create-device-modal.component.html',
    styleUrls: ['./create-device-modal.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        IonInput,
        IonItem,
        IonLabel,
        IonList,
        BaseModalComponent
    ]
})
export class CreateDeviceModalComponent {
    name = '';
    instanceName = '';
    loading = false;

    constructor(
        private modalController: ModalController,
        private whatsappService: WhatsappService,
        private toastService: ToastService
    ) {}

    get isValid(): boolean {
        return this.name.trim().length > 0 && this.instanceName.trim().length > 0;
    }

    dismiss() {
        this.modalController.dismiss({ created: false });
    }

    confirm() {
        if (!this.isValid) {
            this.toastService.warning('Complete todos los campos');
            return;
        }

        this.loading = true;
        this.whatsappService.createDevice({
            name: this.name.trim(),
            instanceName: this.instanceName.trim()
        }).subscribe({
            next: () => {
                this.toastService.success('Dispositivo creado exitosamente');
                this.loading = false;
                this.modalController.dismiss({ created: true });
            },
            error: (error) => {
                console.error('Error creating device:', error);
                const message = error?.error?.message || 'Error al crear el dispositivo';
                this.toastService.error(message);
                this.loading = false;
            }
        });
    }
}
