import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
    informationCircleOutline, 
    alertCircleOutline, 
    checkmarkCircleOutline, 
    warningOutline 
} from 'ionicons/icons';

export type AlertType = 'info' | 'warning' | 'danger' | 'success';

@Component({
    selector: 'app-alert-box',
    templateUrl: './alert-box.component.html',
    styleUrls: ['./alert-box.component.scss'],
    standalone: true,
    imports: [CommonModule, IonIcon]
})
export class AlertBoxComponent {
    @Input() type: AlertType = 'info';
    @Input() message = '';

    constructor() {
        addIcons({ 
            informationCircleOutline, 
            alertCircleOutline, 
            checkmarkCircleOutline, 
            warningOutline 
        });
    }

    get iconName(): string {
        const icons: Record<AlertType, string> = {
            info: 'information-circle-outline',
            warning: 'warning-outline',
            danger: 'alert-circle-outline',
            success: 'checkmark-circle-outline'
        };
        return icons[this.type];
    }
}
