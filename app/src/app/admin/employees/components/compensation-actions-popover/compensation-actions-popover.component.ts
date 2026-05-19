import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonList, IonItem, IonIcon, IonLabel, PopoverController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { createOutline, timeOutline } from 'ionicons/icons';

@Component({
    selector: 'app-compensation-actions-popover',
    template: `
        <ion-content class="compensation-actions-popover">
            <ion-list lines="none">
                <ion-item button (click)="selectAction('edit')" detail="false" class="action-item">
                    <ion-icon slot="start" name="create-outline" color="primary"></ion-icon>
                    <ion-label>
                        <h3>Editar Compensación</h3>
                        <p>Modificar detalles</p>
                    </ion-label>
                </ion-item>
                
                <ion-item button (click)="selectAction('history')" detail="false" class="action-item">
                    <ion-icon slot="start" name="time-outline" color="tertiary"></ion-icon>
                    <ion-label>
                        <h3>Ver Historial</h3>
                        <p>Historial de cambios</p>
                    </ion-label>
                </ion-item>

                <ion-item button (click)="selectAction('cancel')" detail="false" class="action-item danger">
                    <ion-icon slot="start" name="close-circle-outline" color="danger"></ion-icon>
                    <ion-label>
                        <h3>Cancelar Compensación</h3>
                        <p>Cancelar esta compensación</p>
                    </ion-label>
                </ion-item>
            </ion-list>
        </ion-content>
    `,
    styles: [`
        .compensation-actions-popover {
            --background: var(--app-card-bg);
            --padding-top: 0;
            --padding-bottom: 0;
            border-radius: var(--app-border-radius);
            overflow: hidden;
        }

        ion-list {
            padding: 4px 0;
            background: transparent;
            margin: 0;
            border-radius: var(--app-border-radius);
        }

        ion-item {
            --padding-start: 16px;
            --padding-end: 16px;
            --inner-padding-end: 0;
            --min-height: 60px;
            --background: transparent;
            --background-hover: var(--app-hover-bg);
            --background-activated: var(--app-border);
            --border-width: 0;
            --border-radius: 0;
            cursor: pointer;
            transition: all 0.2s ease;
            margin: 0;

            &:hover {
                --background: var(--app-hover-bg);
            }

            &:active {
                --background: var(--app-border);
            }
        }

        ion-icon {
            font-size: 20px;
            margin-right: 16px;
            min-width: 20px;
        }

        ion-label {
            margin: 0;
            
            h3 {
                font-size: 14px;
                font-weight: 500;
                color: var(--app-text-primary);
                margin: 0 0 2px 0;
                line-height: 1.4;
            }

            p {
                font-size: 12px;
                color: var(--app-text-secondary);
                margin: 0;
                line-height: 1.3;
            }
        }

        .action-item.danger {
            ion-label h3 {
                color: var(--ion-color-danger);
            }
        }
    `],
    standalone: true,
    imports: [CommonModule, IonContent, IonList, IonItem, IonIcon, IonLabel]
})
export class CompensationActionsPopoverComponent {
    @Input() compensation?: any;

    constructor(private popoverCtrl: PopoverController) {
        addIcons({ createOutline, timeOutline });
    }

    async selectAction(action: 'edit' | 'history' | 'cancel') {
        await this.popoverCtrl.dismiss({ action, compensation: this.compensation });
    }
}
