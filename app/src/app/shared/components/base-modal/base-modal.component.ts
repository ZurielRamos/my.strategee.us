import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonFooter,
    ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';

@Component({
    selector: 'app-base-modal',
    templateUrl: './base-modal.component.html',
    styleUrls: ['./base-modal.component.scss'],
    standalone: true,
    providers: [ModalController],
    imports: [
        CommonModule,
        IonHeader,
        IonToolbar,
        IonButtons,
        IonButton,
        IonIcon,
        IonContent,
        IonFooter
    ]
})
export class BaseModalComponent {
    @Input() title = '';
    @Input() subtitle = '';
    @Input() showFooter = true;
    @Input() cancelText = 'Cancelar';
    @Input() confirmText = 'Confirmar';
    @Input() confirmDisabled = false;
    @Input() loading = false;

    @Output() modalDismiss = new EventEmitter<void>();
    @Output() modalConfirm = new EventEmitter<void>();

    constructor(private modalController: ModalController) {
        addIcons({ closeOutline });
    }

    dismiss() {
        this.modalDismiss.emit();
        this.modalController.dismiss({ confirmed: false });
    }

    confirm() {
        this.modalConfirm.emit();
    }
}
