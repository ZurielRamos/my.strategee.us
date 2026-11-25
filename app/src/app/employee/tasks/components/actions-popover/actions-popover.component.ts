import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon, IonItem, IonLabel, IonList, PopoverController } from '@ionic/angular/standalone';

export interface PopoverAction {
    key: string;
    label: string;
    icon: string;
    danger?: boolean;
}

/** Menú de acciones (mismo estilo que el de actas). Se cierra devolviendo { action: key }. */
@Component({
    selector: 'app-actions-popover',
    template: `
        <ion-content>
            <ion-list lines="none" class="popover-list">
                @for (action of actions; track action.key) {
                    <ion-item button [class.danger-item]="action.danger" (click)="select(action.key)">
                        <ion-icon [name]="action.icon" slot="start" [color]="action.danger ? 'danger' : undefined"></ion-icon>
                        <ion-label [color]="action.danger ? 'danger' : undefined">{{ action.label }}</ion-label>
                    </ion-item>
                }
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
export class ActionsPopoverComponent {
    @Input() actions: PopoverAction[] = [];

    constructor(private popoverCtrl: PopoverController) { }

    select(key: string) {
        this.popoverCtrl.dismiss({ action: key });
    }
}
