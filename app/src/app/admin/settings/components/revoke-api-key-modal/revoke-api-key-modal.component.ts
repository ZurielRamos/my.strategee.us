import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon, ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { warningOutline } from 'ionicons/icons';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';

@Component({
    selector: 'app-revoke-api-key-modal',
    templateUrl: './revoke-api-key-modal.component.html',
    styleUrls: ['./revoke-api-key-modal.component.scss'],
    standalone: true,
    providers: [ModalController],
    imports: [
        CommonModule,
        IonIcon,
        BaseModalComponent,
    ],
})
export class RevokeApiKeyModalComponent {
    @Input() keyName!: string;

    constructor(private modalCtrl: ModalController) {
        addIcons({ warningOutline });
    }

    onDismiss() {
        this.modalCtrl.dismiss({ confirmed: false });
    }

    onConfirm() {
        this.modalCtrl.dismiss({ confirmed: true });
    }
}
