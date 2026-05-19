import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon, IonInput, ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { warningOutline } from 'ionicons/icons';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';

@Component({
    selector: 'app-request-settings-confirmation-modal',
    templateUrl: './request-settings-confirmation-modal.component.html',
    styleUrls: ['./request-settings-confirmation-modal.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        IonIcon,
        IonInput,
        BaseModalComponent
    ]
})
export class RequestSettingsConfirmationModalComponent {
    confirmationText = '';
    private readonly REQUIRED_TEXT = 'CONFIRMAR CAMBIOS';

    constructor(private modalController: ModalController) {
        addIcons({ warningOutline });
    }

    get isConfirmed(): boolean {
        return this.confirmationText.trim().toUpperCase() === this.REQUIRED_TEXT;
    }

    dismiss() {
        this.modalController.dismiss({ confirmed: false });
    }

    confirm() {
        if (this.isConfirmed) {
            this.modalController.dismiss({ confirmed: true });
        }
    }
}
