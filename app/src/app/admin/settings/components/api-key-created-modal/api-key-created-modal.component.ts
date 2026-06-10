import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon, IonButton, ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { copyOutline, checkmarkOutline, warningOutline } from 'ionicons/icons';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
    selector: 'app-api-key-created-modal',
    templateUrl: './api-key-created-modal.component.html',
    styleUrls: ['./api-key-created-modal.component.scss'],
    standalone: true,
    providers: [ModalController],
    imports: [
        CommonModule,
        IonIcon,
        IonButton,
        BaseModalComponent,
    ],
})
export class ApiKeyCreatedModalComponent {
    @Input() apiKey!: string;
    @Input() keyName!: string;

    copied = false;

    constructor(
        private modalCtrl: ModalController,
        private toastService: ToastService,
    ) {
        addIcons({ copyOutline, checkmarkOutline, warningOutline });
    }

    async copyKey() {
        try {
            await navigator.clipboard.writeText(this.apiKey);
            this.copied = true;
            this.toastService.show({ message: 'API Key copiada al portapapeles', type: 'success' });
            setTimeout(() => this.copied = false, 3000);
        } catch {
            this.toastService.show({ message: 'No se pudo copiar la API Key', type: 'error' });
        }
    }

    onDismiss() {
        this.modalCtrl.dismiss(null, 'close');
    }

    onConfirm() {
        this.modalCtrl.dismiss(null, 'close');
    }
}
