import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonList, IonItem, IonIcon, IonLabel, PopoverController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { createOutline, sendOutline, trashOutline } from 'ionicons/icons';

@Component({
    selector: 'app-minute-actions-popover',
    template: `
        <ion-content>
            <ion-list lines="none" class="popover-list">
                <ion-item button (click)="selectAction('edit')">
                    <ion-icon name="create-outline" slot="start"></ion-icon>
                    <ion-label>Editar</ion-label>
                </ion-item>
                <ion-item button (click)="selectAction('send')">
                    <ion-icon name="send-outline" slot="start"></ion-icon>
                    <ion-label>Enviar</ion-label>
                </ion-item>
                <ion-item button (click)="selectAction('discard')" class="danger-item">
                    <ion-icon name="trash-outline" slot="start" color="danger"></ion-icon>
                    <ion-label color="danger">Descartar</ion-label>
                </ion-item>
            </ion-list>
        </ion-content>
    `,
    styles: [`
        .popover-list {
            padding: 4px 0;

            ion-item {
                --padding-start: 16px;
                --padding-end: 16px;
                --min-height: 44px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;

                ion-icon {
                    font-size: 18px;
                    margin-right: 12px;
                    color: var(--app-text-secondary);
                }

                &.danger-item ion-icon {
                    color: var(--ion-color-danger);
                }
            }
        }
    `],
    standalone: true,
    imports: [CommonModule, IonContent, IonList, IonItem, IonIcon, IonLabel]
})
export class MinuteActionsPopoverComponent {
    constructor(private popoverCtrl: PopoverController) {
        addIcons({ createOutline, sendOutline, trashOutline });
    }

    async selectAction(action: 'edit' | 'send' | 'discard') {
        await this.popoverCtrl.dismiss({ action });
    }
}
